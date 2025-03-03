import { expect, test, describe } from "bun:test";
import { cc } from "bun:ffi";
import source from "../src/x11/x11.c" with { type: "file" };

describe("X11 cursor control", () => {
  const lib = cc({
    source,
    symbols: {
      test_x11_connect: {
        args: [],
        returns: "i32"
      },
      test_hide_cursor: {
        args: [],
        returns: "i32"
      },
      test_show_cursor: {
        args: [],
        returns: "i32"
      }
    },
    includes: ["/usr/include/X11"],
    libs: ["X11", "Xfixes"],
    cflags: ["-lX11", "-lXfixes"]
  });

  test("can connect to X11 display", () => {
    expect(lib.symbols.test_x11_connect()).toBe(0);
  });

  test("can hide cursor", () => {
    expect(lib.symbols.test_hide_cursor()).toBe(0);
  });

  test("can show cursor", () => {
    expect(lib.symbols.test_show_cursor()).toBe(0);
  });
}); 