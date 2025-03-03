import { expect, test, describe } from "bun:test";
import { cc } from "bun:ffi";
import source from "../src/x11/x11.c" with { type: "file" };

describe("X11 cursor control", () => {
  const lib = cc({
    source,
    symbols: {
      x11_hide_cursor: {
        args: [],
        returns: "i32"
      },
      x11_show_cursor: {
        args: [],
        returns: "i32"
      },
      x11_lock_input: {
        args: [],
        returns: "i32"
      },
      x11_unlock_input: {
        args: [],
        returns: "i32"
      },
      x11_cleanup: {
        args: [],
        returns: "void"
      }
    },
    includes: ["/usr/include"],
    libs: ["dl"],
    cflags: ["-ldl"]
  });

  test("can hide/show cursor", () => {
    expect(lib.symbols.x11_hide_cursor()).toBe(0);
    console.log("Cursor hidden");
    
    // Wait a bit to see the effect
    Bun.sleep(1000);
    
    expect(lib.symbols.x11_show_cursor()).toBe(0);
    console.log("Cursor shown");
  });

  test("can lock/unlock input", () => {
    expect(lib.symbols.x11_lock_input()).toBe(0);
    console.log("Input locked");
    
    // Wait a bit to see the effect
    Bun.sleep(1000);
    
    expect(lib.symbols.x11_unlock_input()).toBe(0);
    console.log("Input unlocked");

    // Clean up
    lib.symbols.x11_cleanup();
    console.log("X11 resources cleaned up");
  });
}); 