import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { Peer } from "../src/network/peer.js";
import { DisplayServer } from "../src/display.js";
import "../src/x11/index.js";
import "../src/wayland/index.js";
import { Sway, Gnome, KDE, X11 } from "./headless.js";

describe("Integrated Network and Display Server", () => {
  let peer1, peer2;
  let displayServer;
  let virtualScreen = null;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    // Determine which virtual screen to use based on environment
    const hasWayland = !!process.env.WAYLAND_DISPLAY;
    
    try {
      if (hasWayland && Sway.which('sway')) {
        virtualScreen = new Sway();
        process.env.XDG_SESSION_TYPE = 'wayland';
        process.env.XDG_CURRENT_DESKTOP = 'sway';
      } else if (X11.which('Xvfb')) {
        virtualScreen = new X11();
        process.env.XDG_SESSION_TYPE = 'x11';
      } else {
        console.log("No suitable display server found. Tests will be skipped");
        return;
      }
      
      // Start the virtual screen
      await virtualScreen.start();
      
      // Set the appropriate display environment variable
      if (process.env.XDG_SESSION_TYPE === 'wayland') {
        process.env.WAYLAND_DISPLAY = virtualScreen.display;
      } else if (process.env.XDG_SESSION_TYPE === 'x11') {
        process.env.DISPLAY = virtualScreen.display;
      }
      
      console.log(`Using ${process.env.XDG_SESSION_TYPE} display: ${virtualScreen.display}`);
      
      // Initialize display server for verification
      try {
        displayServer = DisplayServer.create();
        displayServer.setup(1920, 1080);
        console.log(`Using display server type: ${displayServer.constructor.name}`);
      } catch (e) {
        console.error("Failed to create display server:", e);
      }
      
      // Set up the test peers
      peer1 = new Peer({ port: 12345, authToken: "test-token" });
      peer2 = new Peer({ port: 12346, authToken: "test-token" });
      
      await peer1.init();
      await peer2.init();
      
      // Connect peer2 to peer1
      await peer2.connect("127.0.0.1", 12345);
      
      // Give time for authentication to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.error("Error setting up test environment:", e);
      // Clean up if anything went wrong
      if (virtualScreen) {
        virtualScreen.stop();
        virtualScreen = null;
      }
      // Restore original environment
      process.env = { ...originalEnv };
    }
  });

  afterAll(async () => {
    // Clean up the peers
    if (peer1) {
      peer1.cleanup();
    }
    
    if (peer2) {
      peer2.cleanup();
    }
    
    // Clean up virtual screen
    if (virtualScreen) {
      console.log(`Stopping ${process.env.XDG_SESSION_TYPE} display`);
      virtualScreen.stop();
      virtualScreen = null;
    }
    
    // Restore original environment
    process.env = { ...originalEnv };
  });

  test("network peer can initialize display server", async () => {
    // Use internal method to initialize display server
    await peer1.ensureDisplayServerInitialized();
    
    // Check that display server was initialized
    expect(peer1.displayServer).not.toBeNull();
    expect(peer1.displayContext).not.toBeNull();
  });

  test("can send mouse movement over network", async () => {
    // Skip if no display server
    if (!displayServer) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    // Set up a spy to check that the display server function is called
    let wasMouseMoved = false;
    const originalMouseRelativeMotion = peer1.displayServer.mouseRelativeMotion;
    
    peer1.displayServer.mouseRelativeMotion = (ctx, dx, dy) => {
      wasMouseMoved = true;
      expect(dx).toBe(10);
      expect(dy).toBe(20);
      // Call original to ensure actual functionality
      return originalMouseRelativeMotion.call(peer1.displayServer, ctx, dx, dy);
    };
    
    // Send mouse movement from peer2
    await peer2.broadcast("mouse_move", { dx: 10, dy: 20 });
    
    // Wait for message to be processed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check that the mouse was moved
    expect(wasMouseMoved).toBe(true);
    
    // Restore original function
    peer1.displayServer.mouseRelativeMotion = originalMouseRelativeMotion;
  });

  test("can send mouse button over network", async () => {
    // Skip if no display server
    if (!displayServer) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    // Set up a spy to check that the display server function is called
    let wasButtonPressed = false;
    const originalMouseButton = peer1.displayServer.mouseButton;
    
    peer1.displayServer.mouseButton = (ctx, button, pressed) => {
      wasButtonPressed = true;
      expect(button).toBe(1);
      expect(pressed).toBe(1);
      // Call original to ensure actual functionality
      return originalMouseButton.call(peer1.displayServer, ctx, button, pressed);
    };
    
    // Send mouse button from peer2
    await peer2.broadcast("mouse_button", { button: 1, pressed: 1 });
    
    // Wait for message to be processed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check that the button was pressed
    expect(wasButtonPressed).toBe(true);
    
    // Restore original function
    peer1.displayServer.mouseButton = originalMouseButton;
  });

  test("can send keyboard input over network", async () => {
    // Skip if no display server
    if (!displayServer) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    // Set up a spy to check that the display server function is called
    let wasKeyPressed = false;
    const originalKey = peer1.displayServer.key;
    
    peer1.displayServer.key = (ctx, keycode, modifiers, pressed) => {
      wasKeyPressed = true;
      expect(keycode).toBe(30); // 'a' key
      expect(modifiers).toBe(0);
      expect(pressed).toBe(1);
      // Call original to ensure actual functionality
      return originalKey.call(peer1.displayServer, ctx, keycode, modifiers, pressed);
    };
    
    // Send key from peer2
    await peer2.broadcast("key", { keycode: 30, modifiers: 0, pressed: 1 });
    
    // Wait for message to be processed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check that the key was pressed
    expect(wasKeyPressed).toBe(true);
    
    // Restore original function
    peer1.displayServer.key = originalKey;
  });

  test("can send clipboard data over network", async () => {
    // Skip if no display server
    if (!displayServer) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    // Set up a spy to check that the display server function is called
    let wasClipboardCopied = false;
    const originalClipboardCopy = peer1.displayServer.clipboardCopy;
    const testText = "Clipboard test text";
    
    peer1.displayServer.clipboardCopy = (isPrimary, data, length) => {
      wasClipboardCopied = true;
      expect(isPrimary).toBe(0);
      expect(new TextDecoder().decode(data)).toBe(testText);
      // Call original only if clipboard is available
      if (peer1.displayServer.haveClipboard()) {
        return originalClipboardCopy.call(peer1.displayServer, isPrimary, data, length);
      }
      return true;
    };
    
    // Send clipboard data from peer2
    await peer2.broadcast("clipboard", { text: testText, primary: false });
    
    // Wait for message to be processed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check that the clipboard was updated
    expect(wasClipboardCopied).toBe(true);
    
    // Restore original function
    peer1.displayServer.clipboardCopy = originalClipboardCopy;
  });
}); 