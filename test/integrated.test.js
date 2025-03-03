import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { Peer } from "../src/network/peer.js";
import { spawnSync, spawn } from "node:child_process";
import { createDisplayServer } from "../src/display/index.js";

describe("Integrated Network and Display Server", () => {
  let peer1, peer2;
  let displayServer;
  let xvfbProcess = null;
  const initialDisplayNum = 99;
  const originalDisplay = process.env.DISPLAY;

  beforeAll(async () => {
    // Check if we need to start Xvfb (if no Wayland available)
    const hasWayland = !!process.env.WAYLAND_DISPLAY;
    
    if (!hasWayland) {
      // Check if Xvfb is installed
      try {
        const result = spawnSync("which", ["Xvfb"]);
        if (result.status !== 0) {
          console.log("Xvfb not found. Tests will be skipped");
          return;
        }
      } catch (e) {
        console.log("Error checking for Xvfb:", e);
        return;
      }
      
      // Start Xvfb
      try {
        // Look for an available display number
        let displayNum = initialDisplayNum;
        while (displayNum < 200) {
          try {
            // Check if display is already in use
            const checkResult = spawnSync("ls", [`/tmp/.X${displayNum}-lock`]);
            if (checkResult.status !== 0) {
              // Display number is available
              break;
            }
            displayNum++;
          } catch (e) {
            // If checking fails, assume display is available
            break;
          }
        }
  
        console.log(`Starting Xvfb on display :${displayNum}`);
        xvfbProcess = spawn("Xvfb", [`:${displayNum}`, "-screen", "0", "1920x1080x24", "-ac"]);
        
        // Wait for Xvfb to start
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store original DISPLAY value and set to our Xvfb display
        process.env.DISPLAY = `:${displayNum}`;
        
        console.log(`Xvfb started on display ${process.env.DISPLAY}`);
      } catch (e) {
        console.log("Error starting Xvfb:", e);
        
        // Try to clean up if anything went wrong
        if (xvfbProcess) {
          xvfbProcess.kill();
          xvfbProcess = null;
        }
        
        // Restore original DISPLAY
        process.env.DISPLAY = originalDisplay;
      }
    }
    
    // Initialize display server for verification
    try {
      displayServer = await createDisplayServer();
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
  });

  afterAll(async () => {
    // Clean up the peers
    if (peer1) {
      peer1.cleanup();
    }
    
    if (peer2) {
      peer2.cleanup();
    }
    
    // Clean up Xvfb
    if (xvfbProcess) {
      console.log("Stopping Xvfb");
      xvfbProcess.kill();
      xvfbProcess = null;
    }
    
    // Restore original DISPLAY
    process.env.DISPLAY = originalDisplay;
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