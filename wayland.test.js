import { expect, test, describe } from "bun:test";
import {
  wlContextNew,
  wlContextFree,
  wlSetup,
  wlClose,
  wlPrepareFd,
  wlDisplayFlush
} from "./index.js";

describe("wayland FFI", () => {
  test("can initialize wayland context", () => {
    const ctx = wlContextNew();
    expect(wlSetup(ctx, 1920, 1080, null)).toBe(true);
    wlContextFree(ctx);
  });

  test("can get wayland fd", () => {
    const ctx = wlContextNew();
    wlSetup(ctx, 1920, 1080, null);
    const fd = wlPrepareFd(ctx);
    expect(fd).toBeGreaterThan(0);
    wlContextFree(ctx);
  });

  test("can flush display", () => {
    const ctx = wlContextNew();
    wlSetup(ctx, 1920, 1080, null);
    expect(() => wlDisplayFlush(ctx)).not.toThrow();
    wlContextFree(ctx);
  });
});