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
} from "./index.js";

describe("wayland FFI", () => {
  let ctx;

  beforeEach(() => {
    ctx = wlContextNew();
    expect(wlSetup(ctx, 1920, 1080, null)).toBe(true);
  });

  afterEach(() => {
    wlContextFree(ctx);
  });

  test("can initialize wayland context", () => {
    // Context setup is handled by beforeEach
  });

  test("can get wayland fd", () => {
    const fd = wlPrepareFd(ctx);
    expect(fd).toBeGreaterThan(0);
  });

  test("can flush display", () => {
    expect(() => wlDisplayFlush(ctx)).not.toThrow();
  });

  describe("clipboard", () => {
    let hasWlClipboard;

    beforeEach(() => {
      hasWlClipboard = clipHaveWlClipboard();
    });

    test("can check for wl-clipboard", () => {
      // Just verify the function returns without error
      expect(typeof hasWlClipboard).toBe('boolean');
    });

    test("can copy to regular clipboard", () => {
      if (!hasWlClipboard) {
        console.log("Skipping clipboard test - wl-clipboard not installed");
        return;
      }
      const data = new TextEncoder().encode("test data");
      expect(clipWlCopy(0, data, data.length)).toBe(true);
    });

    test("can copy to primary clipboard", () => {
      if (!hasWlClipboard) {
        console.log("Skipping clipboard test - wl-clipboard not installed");
        return;
      }
      const data = new TextEncoder().encode("test data");
      expect(clipWlCopy(1, data, data.length)).toBe(true);
    });
  });

  describe("mouse input", () => {
    test("can move mouse to absolute position", () => {
      expect(() => wlMouseMotion(ctx, 100, 100)).not.toThrow();
    });

    test("can move mouse relatively", () => {
      expect(() => wlMouseRelativeMotion(ctx, 10, 10)).not.toThrow();
    });

    test("can click mouse buttons", () => {
      expect(() => wlMouseButton(ctx, 1, 1)).not.toThrow(); // Press
      expect(() => wlMouseButton(ctx, 1, 0)).not.toThrow(); // Release
    });

    test("can scroll mouse wheel", () => {
      expect(() => wlMouseWheel(ctx, 0, 120)).not.toThrow(); // Scroll up
      expect(() => wlMouseWheel(ctx, 0, -120)).not.toThrow(); // Scroll down
    });
  });

  describe("keyboard input", () => {
    test("can send raw keycode", () => {
      expect(() => wlKeyRaw(ctx, 30, 1)).not.toThrow(); // Press 'a'
      expect(() => wlKeyRaw(ctx, 30, 0)).not.toThrow(); // Release 'a'
    });

    test("can send mapped key", () => {
      expect(() => wlKey(ctx, 30, 0, 1)).not.toThrow(); // Press
      expect(() => wlKey(ctx, 30, 0, 0)).not.toThrow(); // Release
    });

    test("can release all keys", () => {
      expect(() => wlKeyReleaseAll(ctx)).not.toThrow();
    });
  });

  describe("idle inhibition", () => {
    test("can toggle idle inhibition", () => {
      expect(() => wlIdleInhibit(ctx, true)).not.toThrow(); // Enable
      expect(() => wlIdleInhibit(ctx, false)).not.toThrow(); // Disable
    });
  });
});