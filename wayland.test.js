import { expect, test, describe } from "bun:test";
import {
  wlSetup,
  wlClose,
  wlPrepareFd,
  wlDisplayFlush
} from "./index.js";

describe("wayland FFI", () => {
  test("can initialize wayland context", () => {
    const ctx = {};
    console.log('ctx', ctx);
    expect(wlSetup(ctx, 1920, 1080, null)).toBe(true);
    console.log('ctx', ctx);
    wlClose(ctx);
  });

  test("can get wayland fd", () => {
    const ctx = {};
    wlSetup(ctx, 1920, 1080, null);
    const fd = wlPrepareFd(ctx);
    expect(fd).toBeGreaterThan(0);
    wlClose(ctx);
  });

  test("can flush display", () => {
    const ctx = {};
    wlSetup(ctx, 1920, 1080, null);
    expect(() => wlDisplayFlush(ctx)).not.toThrow();
    wlClose(ctx);
  });
});