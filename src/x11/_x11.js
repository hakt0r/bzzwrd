import { dlopen, FFIType, suffix } from "bun:ffi";

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

export class X11Display {
  constructor() {
    this.display = lib.XOpenDisplay(null);
    if (!this.display) {
      throw new Error("Could not open X11 display");
    }
    this.screen = lib.XDefaultScreen(this.display);
    this.rootWindow = lib.XRootWindow(this.display, this.screen);
    this.lastX = 0;
    this.lastY = 0;
    this.lastMask = 0;
  }

  getScreens() {
    return [{
      width: lib.XDisplayWidth(this.display, this.screen),
      height: lib.XDisplayHeight(this.display, this.screen)
    }];
  }

  getMousePosition() {
    const root = new BigUint64Array(1);
    const child = new BigUint64Array(1);
    const rootX = new Int32Array(1);
    const rootY = new Int32Array(1);
    const winX = new Int32Array(1);
    const winY = new Int32Array(1);
    const mask = new Uint32Array(1);

    const result = lib.XQueryPointer(
      this.display,
      this.rootWindow,
      root,
      child,
      rootX,
      rootY,
      winX,
      winY,
      mask
    );

    if (!result) {
      return null;
    }

    const dx = rootX[0] - this.lastX;
    const dy = rootY[0] - this.lastY;
    
    // Check for button state changes
    const buttons = {
      left: !!(mask[0] & Button1Mask),
      middle: !!(mask[0] & Button2Mask),
      right: !!(mask[0] & Button3Mask)
    };

    // Detect button changes
    const buttonChanges = {
      left: !!(mask[0] & Button1Mask) !== !!(this.lastMask & Button1Mask),
      middle: !!(mask[0] & Button2Mask) !== !!(this.lastMask & Button2Mask),
      right: !!(mask[0] & Button3Mask) !== !!(this.lastMask & Button3Mask)
    };

    this.lastX = rootX[0];
    this.lastY = rootY[0];
    this.lastMask = mask[0];

    return { 
      x: rootX[0], 
      y: rootY[0], 
      dx, 
      dy,
      buttons,
      buttonChanges
    };
  }

  cleanup() {
    if (this.display) {
      lib.XCloseDisplay(this.display);
      this.display = null;
    }
  }
} 