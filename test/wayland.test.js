import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import {
  wlContextNew,
  wlContextFree,
  wlSetup,
  wlClose,
  wlPrepareFd,
  wlDisplayFlush,
  clipHaveWlClipboard,
  clipWlCopy,
  wlMouseMotion,
  wlMouseRelativeMotion,
  wlMouseButton,
  wlMouseWheel,
  wlKeyRaw,
  wlKey,
  wlKeyReleaseAll,
  wlIdleInhibit
} from "../src/wayland/_wayland.js";

describe("wayland FFI", () => {
  let ctx;
  let hasWayland;

  beforeEach(() => {
    // Check if we're in a Wayland session
    hasWayland = process.env.WAYLAND_DISPLAY !== undefined;
    if (!hasWayland) {
      console.log("No Wayland session detected - some tests will be skipped");
      return;
    }
    console.log("Wayland session detected");

    ctx = wlContextNew();
    console.log("Context created");

    // Try auto-detection first (passing null lets the library choose the best backend)
    console.log("Attempting to initialize Wayland with auto-detection");
    let success = wlSetup(ctx, 1920, 1080, null);
    
    if (!success) {
      console.log("Auto-detection failed, trying with explicit backends...");
      
      // Try each backend explicitly if auto-detection fails
      const backends = ["wlr", "kde", "uinput"];
      for (const backend of backends) {
        console.log(`Trying ${backend} backend...`);
        wlContextFree(ctx);
        ctx = wlContextNew();
        success = wlSetup(ctx, 1920, 1080, backend);
        if (success) {
          console.log(`Successfully initialized with ${backend} backend`);
          break;
        }
      }
    } else {
      console.log("Successfully initialized with auto-detection");
    }

    if (!success) {
      console.log("Failed to initialize any Wayland backend - some tests will be skipped");
      hasWayland = false;
    } else if (ctx.comp_name) {
      console.log(`Detected compositor: ${ctx.comp_name}`);
    }
  });

  afterEach(() => {
    if (ctx) {
      wlContextFree(ctx);
      ctx = null;
    }
  });

  test("can initialize wayland context", () => {
    if (!hasWayland) {
      console.log("Skipping Wayland initialization test - no Wayland available");
      return;
    }
    
    // In some environments ctx is a number (pointer/handle)
    expect(ctx).toBeDefined();
    
    // Check if it's a valid handle (non-zero)
    if (typeof ctx === 'number') {
      console.log("Context is a numeric handle:", ctx);
      expect(ctx).not.toBe(0);
    } else {
      // If it's an object, check its properties
      console.log("Context properties:", Object.keys(ctx));
      
      if (ctx.comp_name) {
        expect(typeof ctx.comp_name).toBe('string');
        console.log(`Detected compositor: ${ctx.comp_name}`);
      }
      
      if (ctx.width && ctx.height) {
        expect(ctx.width).toBe(1920);
        expect(ctx.height).toBe(1080);
      }
    }
  });

  test("can get wayland fd", () => {
    if (!hasWayland) {
      console.log("Skipping Wayland fd test - no Wayland available");
      return;
    }
    const fd = wlPrepareFd(ctx);
    expect(fd).toBeGreaterThan(0);
  });

  test("can flush display", () => {
    if (!hasWayland) {
      console.log("Skipping display flush test - no Wayland available");
      return;
    }
    expect(() => wlDisplayFlush(ctx)).not.toThrow();
  });

  describe("clipboard", () => {
    let hasWlClipboard;

    beforeEach(() => {
      if (!hasWayland) return;
      hasWlClipboard = clipHaveWlClipboard();
    });

    test("can check for wl-clipboard", () => {
      if (!hasWayland) {
        console.log("Skipping clipboard check test - no Wayland available");
        return;
      }
      expect(typeof hasWlClipboard).toBe('boolean');
    });

    test("can copy to regular clipboard", () => {
      if (!hasWayland || !hasWlClipboard) {
        console.log("Skipping clipboard test - no Wayland or wl-clipboard not installed");
        return;
      }
      const data = new TextEncoder().encode("test data");
      expect(clipWlCopy(0, data, data.length)).toBe(true);
    });

    test("can copy to primary clipboard", () => {
      if (!hasWayland || !hasWlClipboard) {
        console.log("Skipping primary clipboard test - no Wayland or wl-clipboard not installed");
        return;
      }
      const data = new TextEncoder().encode("test data");
      expect(clipWlCopy(1, data, data.length)).toBe(true);
    });
  });

  describe("mouse input", () => {
    test("can move mouse to absolute position", () => {
      if (!hasWayland) {
        console.log("Skipping mouse motion test - no Wayland available");
        return;
      }
      expect(() => wlMouseMotion(ctx, 100, 100)).not.toThrow();
    });

    test("can move mouse relatively", () => {
      if (!hasWayland) {
        console.log("Skipping relative mouse motion test - no Wayland available");
        return;
      }
      expect(() => wlMouseRelativeMotion(ctx, 10, 10)).not.toThrow();
    });

    test("can click mouse buttons", () => {
      if (!hasWayland) {
        console.log("Skipping mouse button test - no Wayland available");
        return;
      }
      expect(() => wlMouseButton(ctx, 1, 1)).not.toThrow(); // Press
      expect(() => wlMouseButton(ctx, 1, 0)).not.toThrow(); // Release
    });

    test("can scroll mouse wheel", () => {
      if (!hasWayland) {
        console.log("Skipping mouse wheel test - no Wayland available");
        return;
      }
      expect(() => wlMouseWheel(ctx, 0, 120)).not.toThrow(); // Scroll up
      expect(() => wlMouseWheel(ctx, 0, -120)).not.toThrow(); // Scroll down
    });
  });

  describe("keyboard input", () => {
    test("can send raw keycode", () => {
      if (!hasWayland) {
        console.log("Skipping raw keycode test - no Wayland available");
        return;
      }
      expect(() => wlKeyRaw(ctx, 30, 1)).not.toThrow(); // Press 'a'
      expect(() => wlKeyRaw(ctx, 30, 0)).not.toThrow(); // Release 'a'
    });

    test("can send mapped key", () => {
      if (!hasWayland) {
        console.log("Skipping mapped key test - no Wayland available");
        return;
      }
      expect(() => wlKey(ctx, 30, 0, 1)).not.toThrow(); // Press
      expect(() => wlKey(ctx, 30, 0, 0)).not.toThrow(); // Release
    });

    test("can release all keys", () => {
      if (!hasWayland) {
        console.log("Skipping key release test - no Wayland available");
        return;
      }
      expect(() => wlKeyReleaseAll(ctx)).not.toThrow();
    });
  });

  describe("idle inhibition", () => {
    test("can toggle idle inhibition", () => {
      if (!hasWayland) {
        console.log("Skipping idle inhibition test - no Wayland available");
        return;
      }
      expect(() => wlIdleInhibit(ctx, true)).not.toThrow(); // Enable
      expect(() => wlIdleInhibit(ctx, false)).not.toThrow(); // Disable
    });
  });
});