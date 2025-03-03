import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { red, green, cyan, gray, yellow, reset, error, success, info, warning, sparkles, skull, handshake, wave, token, mouse } from '../colors.js';
import { createDisplayServer } from '../display/index.js';
import { cc } from "bun:ffi";

const DEFAULT_PORT = 12345;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// For testing only - in production this would be derived from certificates
const SHARED_KEY = Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", 'hex');

export class Peer {
  constructor(options = {}) {
    this.port = options.port || DEFAULT_PORT;
    this.peers = new Map(); // address:port -> peer info
    this.handlers = new Map(); // message type -> handler
    this.authenticatedPeers = new Set(); // Set of authenticated peer addresses
    this.id = randomBytes(16).toString('hex');
    this.key = SHARED_KEY; // Use shared key for testing
    this.authToken = options.authToken; // Store auth token if provided
    this.displayServer = null; // Will be initialized on demand
    this.displayContext = null;
    this.mouseLocked = false;

    if (process.env.DEBUG) {
      console.debug(`${info} Peer ID: ${cyan}${this.id}${reset}`);
      console.debug(`${info} DTLS Key: ${cyan}${this.key.toString('hex')}${reset}`);
    }
  }

  async init() {
    try {
      this.socket = await Bun.udpSocket({
        port: this.port,
        socket: {
          data: (socket, message, port, addr) => {
            this.handleMessage(message, { address: addr, port });
          }
        }
      });

      console.debug(`${info} Listening on port ${cyan}${this.port}${reset}`);

      // Set up built-in message handlers
      this.on("hello", (data, info) => {
        console.debug(`${info} Hello from peer ${cyan}${data.id}${reset} at ${cyan}${info.address}:${info.port}${reset}`);
        // Send auth request if we have a token
        if (this.authToken) {
          console.debug(`${info} Sending auth request to ${cyan}${info.address}:${info.port}${reset}`);
          this.broadcast("auth", { token: this.authToken });
        }
      });

      this.on("auth", (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authToken && data.token === this.authToken) {
          if (!this.authenticatedPeers.has(peerKey)) {
            this.authenticatedPeers.add(peerKey);
            // Add to peers list if not already there (in case we missed the hello)
            if (!this.peers.has(peerKey)) {
              this.peers.set(peerKey, {
                address: info.address,
                port: info.port,
                lastSeen: Date.now()
              });
            }
            console.log(`${handshake} Peer authenticated: ${cyan}${info.address}:${info.port}${reset}`);
            console.debug(`${token} Auth token matches: ${cyan}${data.token}${reset}`);
            
            // Lock mouse on first peer connection
            if (this.authenticatedPeers.size === 1) {
              this.lockMouse();
            }
          }
        } else {
          console.debug(`${warning} Auth failed from ${cyan}${info.address}:${info.port}${reset} - invalid token`);
        }
      });

      this.on("kill", (data, info) => {
        if (this.authToken && data.token === this.authToken) {
          console.log(`${skull} Received kill command, shutting down...${reset}`);
          this.cleanup();
          process.exit(0);
        } else {
          console.debug(`${warning} Rejected kill command from ${cyan}${info.address}:${info.port}${reset} - invalid token`);
        }
      });

      this.on("ping", (data, info) => {
        if (this.authToken && data.token === this.authToken) {
          console.debug(`${info} Ping from ${cyan}${info.address}:${info.port}${reset}, sending pong...`);
          this.broadcast("pong", { id: this.id });
        } else {
          console.debug(`${warning} Rejected ping from ${cyan}${info.address}:${info.port}${reset} - invalid token`);
        }
      });

      // Mouse event handlers
      this.on("mouse_move", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Moving mouse relatively: dx=${cyan}${data.dx}${reset}, dy=${cyan}${data.dy}${reset}`);
          this.displayServer.mouseRelativeMotion(this.displayContext, data.dx, data.dy);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected mouse_move from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("mouse_abs", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Moving mouse to absolute position: x=${cyan}${data.x}${reset}, y=${cyan}${data.y}${reset}`);
          this.displayServer.mouseMotion(this.displayContext, data.x, data.y);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected mouse_abs from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("mouse_button", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Mouse button: button=${cyan}${data.button}${reset}, pressed=${cyan}${data.pressed}${reset}`);
          this.displayServer.mouseButton(this.displayContext, data.button, data.pressed);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected mouse_button from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("mouse_wheel", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Mouse wheel: horizontal=${cyan}${data.horizontal}${reset}, vertical=${cyan}${data.vertical}${reset}`);
          this.displayServer.mouseWheel(this.displayContext, data.horizontal, data.vertical);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected mouse_wheel from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("key", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Key event: keycode=${cyan}${data.keycode}${reset}, modifiers=${cyan}${data.modifiers}${reset}, pressed=${cyan}${data.pressed}${reset}`);
          this.displayServer.key(this.displayContext, data.keycode, data.modifiers, data.pressed);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected key from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("key_raw", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Raw key event: keycode=${cyan}${data.keycode}${reset}, pressed=${cyan}${data.pressed}${reset}`);
          this.displayServer.keyRaw(this.displayContext, data.keycode, data.pressed);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected key_raw from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("key_release_all", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Releasing all keys`);
          this.displayServer.keyReleaseAll(this.displayContext);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected key_release_all from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("idle_inhibit", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          console.debug(`${info} Setting idle inhibit: ${cyan}${data.inhibit}${reset}`);
          this.displayServer.idleInhibit(this.displayContext, data.inhibit);
          this.displayServer.displayFlush(this.displayContext);
        } else {
          console.debug(`${warning} Rejected idle_inhibit from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      this.on("clipboard", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          await this.ensureDisplayServerInitialized();
          
          if (this.displayServer.haveClipboard()) {
            console.debug(`${info} Setting clipboard data: primary=${cyan}${data.primary}${reset}, length=${cyan}${data.text.length}${reset}`);
            const textBytes = new TextEncoder().encode(data.text);
            this.displayServer.clipboardCopy(data.primary ? 1 : 0, textBytes, textBytes.length);
          } else {
            console.debug(`${warning} Clipboard not available`);
          }
        } else {
          console.debug(`${warning} Rejected clipboard from unauthenticated peer ${cyan}${info.address}:${info.port}${reset}`);
        }
      });

      return true;
    } catch (error) {
      console.error(`${error} Failed to initialize peer:`, error);
      return false;
    }
  }

  // Initialize the display server if it's not already initialized
  async ensureDisplayServerInitialized() {
    if (!this.displayServer) {
      console.debug(`${info} Initializing display server...`);
      this.displayServer = await createDisplayServer();
      
      // Get display server type for logging
      const serverType = this.displayServer.constructor.name
        .replace('DisplayServer', '')
        .toLowerCase();
      
      console.debug(`${info} Using display server: ${cyan}${serverType}${reset}`);
      
      // Create context
      this.displayContext = this.displayServer.contextNew();
      const success = this.displayServer.setup(this.displayContext, 1920, 1080);
      
      if (!success) {
        console.error(`${error} Failed to set up display server`);
        throw new Error("Failed to set up display server");
      }
    }
    return this.displayServer;
  }

  // Lock the mouse and hide cursor
  lockMouse() {
    if (this.mouseLocked) {
      console.log("Mouse already locked");
      return;
    }

    try {
      this.ensureDisplayServerInitialized();
      
      if (!this.displayServer || !this.displayContext) {
        console.log("Failed to initialize display server for mouse locking");
        return;
      }

      try {
        // Check for legacy functions first
        if (this.displayServer.type === 'x11') {
          // Try legacy function for X11
          console.log("Using X11 legacy functions for cursor handling");
          if (cc.x11_hide_cursor && cc.x11_lock_input) {
            cc.x11_hide_cursor(this.displayContext);
            cc.x11_lock_input(this.displayContext);
          } else {
            // Fallback to mouse button press
            this.displayServer.mouseButton(this.displayContext, 1, 1);
          }
        } else if (this.displayServer.type === 'wayland') {
          // Try legacy function for Wayland
          console.log("Using Wayland legacy functions for cursor handling");
          if (cc.wayland_hide_cursor && cc.wayland_lock_input) {
            cc.wayland_hide_cursor(this.displayContext);
            cc.wayland_lock_input(this.displayContext);
          } else {
            // Fallback to mouse button press
            this.displayServer.mouseButton(this.displayContext, 1, 1);
          }
        } else {
          console.log(`Unknown display server type: ${this.displayServer.type}`);
          // Generic fallback
          this.displayServer.mouseButton(this.displayContext, 1, 1);
        }
        
        this.mouseLocked = true;
        console.log("🖱️  Mouse locked and hidden");
      } catch (e) {
        console.log(`Failed to hide cursor: ${e}`);
        this.mouseLocked = false;
      }
    } catch (e) {
      console.log(`Error during mouse lock: ${e}`);
      this.mouseLocked = false;
    }
  }

  // Unlock the mouse and show cursor
  async unlockMouse() {
    try {
      if (!this.mouseLocked) return;
      
      // If no display server, we can't unlock
      if (!this.displayServer || !this.displayContext) {
        this.mouseLocked = false;
        console.log(`${mouse} Mouse unlocked and visible`);
        return;
      }
      
      try {
        const { symbols } = cc({
          source: this.displayServer.constructor.name.includes("X11") 
            ? "./src/x11/x11.c" 
            : "./src/wayland/wayland.c",
          symbols: {
            x11_show_cursor: { args: [], returns: "i32" },
            x11_unlock_input: { args: [], returns: "i32" },
            wl_show_cursor: { args: [], returns: "i32" },
            wl_unlock_input: { args: [], returns: "i32" }
          },
          includes: ["/usr/include"],
          libs: ["dl"],
          cflags: ["-ldl"]
        });
        
        // Try to show cursor and unlock input based on the display server type
        if (this.displayServer.constructor.name.includes("X11")) {
          symbols.x11_show_cursor();
          symbols.x11_unlock_input();
        } else {
          symbols.wl_show_cursor();
          symbols.wl_unlock_input();
        }
      } catch (e) {
        console.error(`Failed to show cursor: ${e}`);
        
        // Use button release as fallback for unlocking
        try {
          // Simulate mouse button release to unlock input as fallback
          if (this.displayServer && this.displayContext) {
            this.displayServer.mouseButton(this.displayContext, 1, 0);
          }
        } catch (err) {
          console.error(`Failed to unlock input: ${err}`);
        }
      }
      
      this.mouseLocked = false;
      console.log(`${mouse} Mouse unlocked and visible`);
    } catch (error) {
      console.error(`${error} Failed to unlock mouse:`, error);
      this.mouseLocked = false; // Ensure flag is reset even if error
    }
  }

  async connect(address, port = DEFAULT_PORT) {
    try {
      // Store the peer info
      this.peers.set(`${address}:${port}`, {
        address,
        port,
        lastSeen: Date.now()
      });

      // Send a hello message
      console.debug(`${info} Connecting to ${cyan}${address}:${port}${reset}...`);
      console.debug(`${info} Sending hello with ID ${cyan}${this.id}${reset}`);
      await this.broadcast("hello", { id: this.id });

      // Wait a bit for auth to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send auth if we have a token
      if (this.authToken) {
        console.debug(`${info} Sending auth token to ${cyan}${address}:${port}${reset}`);
        await this.broadcast("auth", { token: this.authToken });
      }

      console.log(`${sparkles} Connected to ${cyan}${address}:${port}${reset}`);
      return true;
    } catch (error) {
      console.error(`${error} Failed to connect to ${address}:${port}:`, error);
      return false;
    }
  }

  encrypt(data) {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]);
  }

  decrypt(data) {
    try {
      const iv = data.subarray(0, IV_LENGTH);
      const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
    }
  }

  async broadcast(type, data) {
    const message = {
      type,
      data,
      sender: this.id,
      timestamp: Date.now()
    };

    const payload = this.encrypt(Buffer.from(JSON.stringify(message)));
    const packets = [];

    for (const [_, peer] of this.peers) {
      packets.push(payload, peer.port, peer.address);
    }

    if (packets.length > 0) {
      const sent = this.socket.sendMany(packets);
      if (sent < packets.length / 3) {
        console.warn(`${warning} Only sent ${sent} out of ${packets.length / 3} packets`);
      }
      console.debug(`${info} Broadcasting ${cyan}${type}${reset} (${cyan}${payload.length}${reset} bytes) to ${cyan}${packets.length / 3}${reset} peers`);
      for (const [_, peer] of this.peers) {
        console.debug(`${gray}  → ${cyan}${peer.address}:${peer.port}${reset}`);
      }
    }
  }

  on(type, handler) {
    this.handlers.set(type, handler);
  }

  handleMessage(message, rinfo) {
    try {
      // Log raw packet
      console.debug(`${info} Received ${cyan}${message.length}${reset} bytes from ${cyan}${rinfo.address}:${rinfo.port}${reset}`);

      // Decrypt the message
      const decrypted = this.decrypt(message);
      const { type, data, sender, timestamp } = JSON.parse(decrypted.toString());
      
      // Don't process our own messages
      if (sender === this.id) {
        console.debug(`${gray}Ignoring own message of type ${cyan}${type}${reset}`);
        return;
      }

      // Update peer's last seen time
      const peerKey = `${rinfo.address}:${rinfo.port}`;

      // Handle hello messages for peer discovery
      if (type === "hello") {
        console.debug(`${info} Processing hello from ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
        console.debug(`Message data: ${JSON.stringify(data, null, 2)}`);
        this.peers.set(peerKey, {
          address: rinfo.address,
          port: rinfo.port,
          lastSeen: Date.now(),
          id: data.id
        });
      }

      // Process message using the appropriate handler
      if (this.handlers.has(type)) {
        const handler = this.handlers.get(type);
        
        // Check authentication for non-hello and non-auth messages
        if (type !== "hello" && type !== "auth" && !this.authenticatedPeers.has(peerKey)) {
          console.debug(`${warning} Rejected ${type} from unauthenticated peer ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
          return;
        }
        
        console.debug(`${info} Processing ${cyan}${type}${reset} from ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
        console.debug(`Message data: ${JSON.stringify(data, null, 2)}`);
        handler(data, rinfo);
      } else {
        console.debug(`${warning} No handler for message type: ${cyan}${type}${reset}`);
      }
    } catch (error) {
      console.error(`${error} Error handling message:`, error);
    }
  }

  cleanup() {
    console.log(`${success} Cleaned up peer resources`);
    
    // Release mouse if it's locked
    if (this.mouseLocked) {
      this.unlockMouse().catch(err => {
        console.error(`${error} Failed to unlock mouse during cleanup:`, err);
      });
    }
    
    // Clean up display server resources
    if (this.displayServer && this.displayContext) {
      try {
        this.displayServer.contextFree(this.displayContext);
        this.displayContext = null;
        this.displayServer = null;
      } catch (err) {
        console.error(`${error} Failed to clean up display server resources:`, err);
        // Ensure we null these out even if there's an error
        this.displayContext = null;
        this.displayServer = null;
      }
    }
    
    // Close the socket
    if (this.socket) {
      try {
        this.socket.close();
        this.socket = null;
      } catch (err) {
        console.error(`${error} Failed to close socket:`, err);
        this.socket = null;
      }
    }
  }
} 