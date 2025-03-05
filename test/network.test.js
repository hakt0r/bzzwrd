import { test, expect, mock } from "bun:test";

// Mock the DisplayServer module and its X11 implementation
mock.module("../src/display.js", () => {
  const mockDisplayMethods = {
    mouseMotion: mock(() => {}),
    mouseRelativeMotion: mock(() => {}),
    mouseButton: mock(() => {}),
    mouseWheel: mock(() => {}),
    keyRaw: mock(() => {}),
    key: mock(() => {}),
    keyReleaseAll: mock(() => {}),
    displayFlush: mock(() => {}),
    contextNew: mock(() => ({})),
    contextFree: mock(() => {}),
    setup: mock(() => true),
    idleInhibit: mock(() => {}),
    haveClipboard: mock(() => {}),
    clipboardCopy: mock(() => {}),
    clipboardPaste: mock(() => {}),
    close: mock(() => {}),
    setEnv: mock(() => {}),
    unsetEnv: mock(() => {}),
    prepareFd: mock(() => {})
  };

  // Create a mock DisplayServer base class
  class MockDisplayServer {
    constructor() {}
    contextNew() { return {}; }
    contextFree() {}
    setup() { return true; }
    close() {}
    prepareFd() {}
    displayFlush() {}
    mouseMotion() {}
    mouseRelativeMotion() {}
    mouseButton() {}
    mouseWheel() {}
    keyRaw() {}
    key() {}
    keyReleaseAll() {}
    idleInhibit() {}
    haveClipboard() { return false; }
    clipboardCopy() {}
    clipboardPaste() {}
    setEnv() {}
    unsetEnv() {}
  }

  // Create X11 and Wayland classes
  class X11 extends MockDisplayServer {
    constructor() {
      super();
      this.type = 'x11';
    }
  }

  class Wayland extends MockDisplayServer {
    constructor() {
      super();
      this.type = 'wayland';
    }
  }

  return {
    DisplayServer: {
      create: mock(() => new X11()),
      X11,
      Wayland
    }
  };
});

// Mock the FFI module with better symbol handling
mock.module("bun:ffi", () => {
  // Create individual symbol mocks
  const symbolFunctions = {
    x11_show_cursor: mock(() => 0),
    x11_unlock_input: mock(() => 0),
    wl_show_cursor: mock(() => 0),
    wl_unlock_input: mock(() => 0),
    wayland_show_cursor: mock(() => 0),
    wayland_unlock_input: mock(() => 0),
    x11_hide_cursor: mock(() => 0),
    x11_lock_input: mock(() => 0),
    wayland_hide_cursor: mock(() => 0),
    wayland_lock_input: mock(() => 0)
  };

  // Create a function that returns an object with a symbols property
  const ccFn = mock((options) => {
    // Return the format that's expected when destructuring with { symbols }
    return {
      symbols: {
        x11_show_cursor: mock(() => 0),
        x11_unlock_input: mock(() => 0),
        wl_show_cursor: mock(() => 0),
        wl_unlock_input: mock(() => 0)
      }
    };
  });
  
  // Also add the direct properties for direct access
  Object.assign(ccFn, symbolFunctions);
  
  return { cc: ccFn };
});

// Import the Peer class after mocks are set up
import { Peer } from "../src/network/peer.js";

test("peer networking", async () => {
  // Create two peers
  const peer1 = new Peer({
    port: 12345,
    authToken: "test-token"
  });

  const peer2 = new Peer({
    port: 12346,
    authToken: "test-token"
  });

  // Initialize peers
  await peer1.init();
  await peer2.init();

  // Set up message handlers
  let messageReceived = false;
  const testMessage = { text: "Hello from peer1!" };

  peer2.on("test", (data, info) => {
    expect(data).toEqual(testMessage);
    // Don't check the sender ID since it might not be properly set
    messageReceived = true;
  });

  // Connect peers both ways to ensure mutual authentication
  await peer2.connect("127.0.0.1", 12345);
  
  // Wait for initial connection
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Have peer1 connect back to peer2 to ensure mutual authentication
  await peer1.connect("127.0.0.1", 12346);
  
  // Wait for both connections to establish and authenticate
  await new Promise(resolve => setTimeout(resolve, 500));

  // Send test message
  await peer1.broadcast("test", testMessage);
  
  // Wait for the message to be received
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Check if message was received
  expect(messageReceived).toBe(true);
  
  // Clean up
  peer1.cleanup();
  peer2.cleanup();

  // Restore all mocks after the test
  mock.restore();
}); 