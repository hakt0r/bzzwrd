import { dlopen, FFIType, suffix } from "bun:ffi";
import { cc } from "bun:ffi";
import source from "./x11.c" with { type: "file" };

// Use consistent naming with Wayland bindings
const { symbols } = cc({
  source,
  includes: ["/usr/include"],
  libs: ["dl", "X11", "Xfixes", "Xtst", "Xext"],
  cflags: ["-ldl"],
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
    },
    x11_mouse_motion: {
      args: ["i32", "i32"],
      returns: "i32"
    },
    x11_mouse_relative_motion: {
      args: ["i32", "i32"],
      returns: "i32"
    },
    x11_mouse_button: {
      args: ["i32", "i32"],
      returns: "i32"
    },
    x11_mouse_wheel: {
      args: ["i32", "i32"],
      returns: "i32"
    },
    x11_key_raw: {
      args: ["i32", "i32"],
      returns: "i32"
    },
    x11_key: {
      args: ["i32", "i32", "i32"],
      returns: "i32"
    },
    x11_key_release_all: {
      args: [],
      returns: "i32"
    },
    x11_idle_inhibit: {
      args: ["i32"],
      returns: "i32"
    },
    x11_have_clipboard: {
      args: [],
      returns: "i32"
    },
    x11_clipboard_copy: {
      args: ["i32", "ptr", "u64"],
      returns: "i32"
    }
  }
});

// For X11 screen and mouse info
const lib = dlopen(`libX11.${suffix}`, {
  XOpenDisplay: {
    args: ["ptr"],
    returns: FFIType.ptr
  },
  XDefaultScreen: {
    args: ["ptr"],
    returns: FFIType.i32
  },
  XDisplayWidth: {
    args: ["ptr", "i32"],
    returns: FFIType.i32
  },
  XDisplayHeight: {
    args: ["ptr", "i32"],
    returns: FFIType.i32
  },
  XRootWindow: {
    args: ["ptr", "i32"],
    returns: FFIType.u64
  },
  XQueryPointer: {
    args: ["ptr", "u64", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr"],
    returns: FFIType.i32
  },
  XCloseDisplay: {
    args: ["ptr"],
    returns: FFIType.i32
  }
}).symbols;

// X11 button masks
const Button1Mask = 1 << 8;
const Button2Mask = 1 << 9;
const Button3Mask = 1 << 10;

// Export functions with Wayland-compatible names
export function x11ContextNew() {
  return {
    display: lib.XOpenDisplay(null),
    screen: null,
    rootWindow: null,
    width: 0,
    height: 0,
    lastX: 0,
    lastY: 0,
    lastMask: 0
  };
}

export function x11ContextFree(ctx) {
  if (ctx.display) {
    lib.XCloseDisplay(ctx.display);
    ctx.display = null;
  }
  symbols.x11_cleanup();
}

export function x11Setup(ctx, width, height) {
  if (!ctx.display) {
    return false;
  }
  
  ctx.screen = lib.XDefaultScreen(ctx.display);
  ctx.rootWindow = lib.XRootWindow(ctx.display, ctx.screen);
  ctx.width = width || lib.XDisplayWidth(ctx.display, ctx.screen);
  ctx.height = height || lib.XDisplayHeight(ctx.display, ctx.screen);
  
  return true;
}

export function x11Close(ctx) {
  x11ContextFree(ctx);
}

export function x11PrepareFd() {
  // X11 doesn't have an equivalent to this Wayland feature
  // but we'll return a dummy value for API compatibility
  return 1; 
}

export function x11DisplayFlush() {
  // X11 flushes automatically with most operations
  return true;
}

// Mouse functions that match the Wayland API
export function x11MouseMotion(ctx, x, y) {
  return symbols.x11_mouse_motion(x, y) === 0;
}

export function x11MouseRelativeMotion(ctx, dx, dy) {
  return symbols.x11_mouse_relative_motion(dx, dy) === 0;
}

export function x11MouseButton(ctx, button, pressed) {
  return symbols.x11_mouse_button(button, pressed) === 0;
}

export function x11MouseWheel(ctx, horizontal, vertical) {
  return symbols.x11_mouse_wheel(horizontal, vertical) === 0;
}

// Keyboard functions that match the Wayland API
export function x11KeyRaw(ctx, keycode, pressed) {
  return symbols.x11_key_raw(keycode, pressed) === 0;
}

export function x11Key(ctx, keycode, modifiers, pressed) {
  return symbols.x11_key(keycode, modifiers, pressed) === 0;
}

export function x11KeyReleaseAll(ctx) {
  return symbols.x11_key_release_all() === 0;
}

// Idle inhibition to match Wayland API
export function x11IdleInhibit(ctx, inhibit) {
  return symbols.x11_idle_inhibit(inhibit ? 1 : 0) === 0;
}

// Clipboard operations
export function clipHaveX11Clipboard() {
  return symbols.x11_have_clipboard() === 1;
}

export function clipX11Copy(isPrimary, data, dataLength) {
  return symbols.x11_clipboard_copy(isPrimary ? 1 : 0, data, dataLength) === 1;
} 