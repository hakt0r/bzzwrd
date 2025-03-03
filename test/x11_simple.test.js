import { expect, test, describe } from "bun:test";
import { cc } from "bun:ffi";
import source from "../src/x11/x11_simple.c" with { type: "file" };

describe("X11 basic test", () => {
  const lib = cc({
    source,
    symbols: {
      test_x11: {
        args: [],
        returns: "i32"
      }
    },
    includes: ["/usr/include"],
    libs: ["dl"],
    cflags: ["-ldl"]
  });

  test("can connect to X11", () => {
    const result = lib.symbols.test_x11();
    console.log("X11 test result:", result);
    expect(result).toBe(0);
  });
}); 