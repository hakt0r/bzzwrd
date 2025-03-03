import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { red, green, cyan, gray, yellow, reset, error, success, info, warning, sparkles, skull, handshake, wave, token, mouse } from '../colors.js';

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
    this.virtualMouse = null; // Will be initialized if needed
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
          if (!this.virtualMouse) {
            const { VirtualMouse } = await import("../virtual.js");
            this.virtualMouse = new VirtualMouse();
            await this.virtualMouse.init();
          }
          console.debug(`${info} Moving mouse: dx=${cyan}${data.dx}${reset}, dy=${cyan}${data.dy}${reset}`);
          await this.virtualMouse.moveRelative(data.dx, data.dy);
        }
      });

      this.on("mouse_click", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          if (!this.virtualMouse) {
            const { VirtualMouse } = await import("../virtual.js");
            this.virtualMouse = new VirtualMouse();
            await this.virtualMouse.init();
          }
          console.debug(`${info} Mouse click: button=${cyan}${data.button}${reset}`);
          await this.virtualMouse.click(data.button);
        }
      });

      this.on("mouse_drag", async (data, info) => {
        const peerKey = `${info.address}:${info.port}`;
        if (this.authenticatedPeers.has(peerKey)) {
          if (!this.virtualMouse) {
            const { VirtualMouse } = await import("../virtual.js");
            this.virtualMouse = new VirtualMouse();
            await this.virtualMouse.init();
          }
          console.debug(`${info} Mouse drag: x=${cyan}${data.x}${reset}, y=${cyan}${data.y}${reset}`);
          await this.virtualMouse.dragTo(data.x, data.y);
        }
      });

      return true;
    } catch (error) {
      console.error(`${error} Failed to initialize peer:`, error);
      return false;
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
        console.debug(`${info} Hello from peer ${cyan}${data.id}${reset} at ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
        // Add to peers list if not already there
        if (!this.peers.has(peerKey)) {
          this.peers.set(peerKey, {
            address: rinfo.address,
            port: rinfo.port,
            lastSeen: Date.now()
          });
        }
        // Send auth request if we have a token
        if (this.authToken) {
          console.debug(`${info} Sending auth request to ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
          this.broadcast("auth", { token: this.authToken });
        }
      }

      // Handle auth messages
      if (type === "auth") {
        const handler = this.handlers.get(type);
        if (handler) {
          handler(data, { sender, timestamp, address: rinfo.address, port: rinfo.port });
        }
        return; // Skip default handler processing for auth messages
      }

      // Handle disconnect
      if (type === "disconnect") {
        this.peers.delete(peerKey);
        this.authenticatedPeers.delete(peerKey);
        console.log(`${wave} Peer disconnected: ${rinfo.address}:${rinfo.port}`);
        
        // Unlock mouse when last peer disconnects
        if (this.authenticatedPeers.size === 0) {
          this.unlockMouse();
        }
      }

      // Update last seen time for existing peers
      const peer = this.peers.get(peerKey);
      if (peer) {
        peer.lastSeen = Date.now();
      }

      // Call the appropriate handler
      const handler = this.handlers.get(type);
      if (handler) {
        if (!this.authenticatedPeers.has(peerKey) && !["hello", "auth"].includes(type)) {
          console.debug(`${warning} Rejected ${cyan}${type}${reset} from unauthenticated peer ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
          return;
        }

        console.debug(`${info} Processing ${cyan}${type}${reset} from ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
        if (data) {
          console.debug(`${gray}Message data:${reset}`, data);
        }
        handler(data, { sender, timestamp, address: rinfo.address, port: rinfo.port });
      } else {
        console.debug(`${warning} No handler for message type ${cyan}${type}${reset} from ${cyan}${rinfo.address}:${rinfo.port}${reset}`);
      }
    } catch (error) {
      console.error(`${error} Failed to handle message from ${cyan}${rinfo.address}:${rinfo.port}${reset}:`, error);
    }
  }

  handleConnect(rinfo) {
    const peerKey = `${rinfo.address}:${rinfo.port}`;
    if (!this.peers.has(peerKey)) {
      this.peers.set(peerKey, {
        address: rinfo.address,
        port: rinfo.port,
        lastSeen: Date.now()
      });
      console.log(`${handshake} New peer connected: ${rinfo.address}:${rinfo.port}`);
    }
  }

  handleDisconnect(rinfo) {
    const peerKey = `${rinfo.address}:${rinfo.port}`;
    this.peers.delete(peerKey);
    this.authenticatedPeers.delete(peerKey);
    console.log(`${wave} Peer disconnected: ${rinfo.address}:${rinfo.port}`);
  }

  async lockMouse() {
    if (this.mouseLocked) return;
    
    try {
      if (!this.virtualMouse) {
        const { VirtualMouse } = await import("../virtual.js");
        this.virtualMouse = new VirtualMouse();
        await this.virtualMouse.init();
      }
      
      // Hide cursor and lock input
      await this.virtualMouse.hideCursor();
      await this.virtualMouse.lockInput();
      
      this.mouseLocked = true;
      console.log(`${mouse} Mouse locked and hidden`);
    } catch (error) {
      console.error(`${error} Failed to lock mouse:`, error);
    }
  }

  async unlockMouse() {
    if (!this.mouseLocked) return;
    
    try {
      if (this.virtualMouse) {
        await this.virtualMouse.showCursor();
        await this.virtualMouse.unlockInput();
      }
      
      this.mouseLocked = false;
      console.log(`${mouse} Mouse unlocked and visible`);
    } catch (error) {
      console.error(`${error} Failed to unlock mouse:`, error);
    }
  }

  cleanup() {
    if (this.socket) {
      this.socket.close();
    }
    if (this.virtualMouse) {
      this.unlockMouse();
      this.virtualMouse.cleanup();
    }
    this.peers.clear();
    this.authenticatedPeers.clear();
    console.log(`${success} Cleaned up peer resources`);
  }
} 