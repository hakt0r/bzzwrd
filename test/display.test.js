import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { spawnSync, spawn } from "node:child_process";
import path from "path";

// Use direct imports to avoid issues in the test
import { DisplayServer } from "../src/display/display-server.js";
import { X11DisplayServer } from "../src/display/display-server.js";
import { WaylandDisplayServer } from "../src/display/display-server.js";
import { createDisplayServer } from "../src/display/display-server.js";

describe("Unified Display Server API", () => {
  let server;
  let ctx;
  let xvfbProcess = null;
  const initialDisplayNum = 99;
  const originalDisplay = process.env.DISPLAY;
  let hasX11;
  let hasWayland;

  beforeAll(async () => {
    // First detect which display servers are available
    hasWayland = !!process.env.WAYLAND_DISPLAY;
    
    if (!hasWayland) {
      // If no Wayland, try to set up Xvfb for X11 testing
      
      // Check if Xvfb is installed
      try {
        const result = spawnSync("which", ["Xvfb"]);
        if (result.status !== 0) {
          console.log("Xvfb not found. Some tests will be skipped");
          hasX11 = false;
          return;
        }
      } catch (e) {
        console.log("Error checking for Xvfb:", e);
        hasX11 = false;
        return;
      }
      
      // Try to start Xvfb
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
        
        // Now check if we can access X11
        hasX11 = true;
      } catch (e) {
        console.log("Error starting Xvfb:", e);
        hasX11 = false;
        
        // Try to clean up if anything went wrong
        if (xvfbProcess) {
          xvfbProcess.kill();
          xvfbProcess = null;
        }
        
        // Restore original DISPLAY
        process.env.DISPLAY = originalDisplay;
        return;
      }
    }
    
    // Now create the display server
    try {
      server = await createDisplayServer();
      console.log("Created display server:", server.constructor.name);
      
      // Create the context
      ctx = server.contextNew();
      console.log("Created context:", ctx);
      
      // Setup the display
      const success = server.setup(ctx, 1920, 1080, null);
      if (!success) {
        console.log("Failed to set up display server. Tests will be skipped.");
        if (ctx) {
          server.contextFree(ctx);
          ctx = null;
        }
        server = null;
      }
    } catch (e) {
      console.error("Error creating display server:", e);
      server = null;
    }
  });

  afterAll(() => {
    // Clean up
    if (ctx && server) {
      server.contextFree(ctx);
      ctx = null;
    }
    
    // Clean up Xvfb
    if (xvfbProcess) {
      console.log("Stopping Xvfb");
      xvfbProcess.kill();
      xvfbProcess = null;
    }
    
    // Restore original DISPLAY value
    process.env.DISPLAY = originalDisplay;
  });

  test("can create a display server instance", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(server).toBeInstanceOf(DisplayServer);
    if (hasWayland) {
      expect(server).toBeInstanceOf(WaylandDisplayServer);
    } else if (hasX11) {
      expect(server).toBeInstanceOf(X11DisplayServer);
    }
  });

  test("can create a context", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(ctx).toBeDefined();
  });

  test("can get display file descriptor", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    const fd = server.prepareFd(ctx);
    if (server instanceof WaylandDisplayServer) {
      expect(fd).toBeGreaterThan(0);
    } else {
      // X11 uses a dummy fd
      expect(fd).toBe(1);
    }
  });

  test("can flush display", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const result = server.displayFlush(ctx);
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(result).toBe(true);
      }
    }).not.toThrow();
  });

  test("can move mouse", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const result = server.mouseMotion(ctx, 100, 100);
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(result).toBe(true);
      }
    }).not.toThrow();
  });

  test("can move mouse relatively", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const result = server.mouseRelativeMotion(ctx, 10, 10);
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(result).toBe(true);
      }
    }).not.toThrow();
  });

  test("can click mouse buttons", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const resultPress = server.mouseButton(ctx, 1, 1);
      const resultRelease = server.mouseButton(ctx, 1, 0);
      
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(resultPress).toBe(true);
        expect(resultRelease).toBe(true);
      }
    }).not.toThrow();
  });

  test("can scroll mouse wheel", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const resultUp = server.mouseWheel(ctx, 0, 120);
      const resultDown = server.mouseWheel(ctx, 0, -120);
      
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(resultUp).toBe(true);
        expect(resultDown).toBe(true);
      }
    }).not.toThrow();
  });

  test("can send keyboard input", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const resultPress = server.keyRaw(ctx, 30, 1);
      const resultRelease = server.keyRaw(ctx, 30, 0);
      
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(resultPress).toBe(true);
        expect(resultRelease).toBe(true);
      }
    }).not.toThrow();
  });

  test("can release all keys", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const result = server.keyReleaseAll(ctx);
      
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(result).toBe(true);
      }
    }).not.toThrow();
  });

  test("can toggle idle inhibition", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    expect(() => {
      const resultEnable = server.idleInhibit(ctx, true);
      const resultDisable = server.idleInhibit(ctx, false);
      
      // X11 returns a boolean, Wayland doesn't
      if (server instanceof X11DisplayServer) {
        expect(resultEnable).toBe(true);
        expect(resultDisable).toBe(true);
      }
    }).not.toThrow();
  });

  test("can check for clipboard", () => {
    if (!server) {
      console.log("Skipping test - no display server available");
      return;
    }
    
    const hasClipboard = server.haveClipboard();
    expect(typeof hasClipboard).toBe('boolean');
  });
}); 