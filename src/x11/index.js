import { dlopen, FFIType, suffix } from 'bun:ffi';
import { cc } from 'bun:ffi';
import source from './x11.c' with { type: 'file' };
import { DisplayServer } from '../display.js';

const { symbols } = cc({
  source,
  includes: ['/usr/include'],
  libs: ['dl', 'X11', 'Xfixes', 'Xtst', 'Xext'],
  cflags: ['-ldl'],
  symbols: {
    x11_hide_cursor: {
      args: [],
      returns: 'i32',
    },
    x11_show_cursor: {
      args: [],
      returns: 'i32',
    },
    x11_lock_input: {
      args: [],
      returns: 'i32',
    },
    x11_unlock_input: {
      args: [],
      returns: 'i32',
    },
    x11_cleanup: {
      args: [],
      returns: 'void',
    },
    x11_mouse_motion: {
      args: ['i32', 'i32'],
      returns: 'i32',
    },
    x11_mouse_relative_motion: {
      args: ['i32', 'i32'],
      returns: 'i32',
    },
    x11_mouse_button: {
      args: ['i32', 'i32'],
      returns: 'i32',
    },
    x11_mouse_wheel: {
      args: ['i32', 'i32'],
      returns: 'i32',
    },
    x11_key_raw: {
      args: ['i32', 'i32'],
      returns: 'i32',
    },
    x11_key: {
      args: ['i32', 'i32', 'i32'],
      returns: 'i32',
    },
    x11_key_release_all: {
      args: [],
      returns: 'i32',
    },
    x11_idle_inhibit: {
      args: ['i32'],
      returns: 'i32',
    },
    x11_set_env: {
      args: ['ptr', 'ptr'],
      returns: 'i32',
    },
    x11_unset_env: {
      args: ['ptr'],
      returns: 'i32',
    },
  },
});

const lib = dlopen(`libX11.${suffix}`, {
  XOpenDisplay: {
    args: ['ptr'],
    returns: FFIType.ptr,
  },
  XDefaultScreen: {
    args: ['ptr'],
    returns: FFIType.i32,
  },
  XDisplayWidth: {
    args: ['ptr', 'i32'],
    returns: FFIType.i32,
  },
  XDisplayHeight: {
    args: ['ptr', 'i32'],
    returns: FFIType.i32,
  },
  XRootWindow: {
    args: ['ptr', 'i32'],
    returns: FFIType.u64,
  },
  XQueryPointer: {
    args: ['ptr', 'u64', 'ptr', 'ptr', 'ptr', 'ptr', 'ptr', 'ptr', 'ptr'],
    returns: FFIType.i32,
  },
  XCloseDisplay: {
    args: ['ptr'],
    returns: FFIType.i32,
  },
}).symbols;

const Button1Mask = 1 << 8;
const Button2Mask = 1 << 9;
const Button3Mask = 1 << 10;

export class X11 extends DisplayServer {
  constructor() {
    super();
    this.initialized = true;
    this.contextNew();
  }

  contextNew() {
    this.ptr = 0;
    this.display = lib.XOpenDisplay(null);
    this.screen = null;
    this.rootWindow = null;
    this.width = 0;
    this.height = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.lastMask = 0;
  }

  contextFree() {
    if (this.display) {
      lib.XCloseDisplay(this.display);
      this.display = null;
    }
    symbols.x11_cleanup();
  }

  setup(width, height) {
    if (!this.display) return false;

    this.screen = lib.XDefaultScreen(this.display);
    this.rootWindow = lib.XRootWindow(this.display, this.screen);
    this.width = width || lib.XDisplayWidth(this.display, this.screen);
    this.height = height || lib.XDisplayHeight(this.display, this.screen);

    return true;
  }

  close(ctx) {
    this.contextFree();
    return true;
  }

  prepareFd(ctx) {
    // X11 doesn't have an equivalent to this Wayland feature
    // but we'll return a dummy value for API compatibility
    return 1;
  }

  displayFlush(ctx) {
    // X11 flushes automatically with most operations
    return true;
  }

  mouseMotion(x, y) {
    return symbols.x11_mouse_motion(x, y) === 0;
  }

  mouseRelativeMotion(dx, dy) {
    return symbols.x11_mouse_relative_motion(dx, dy) === 0;
  }

  mouseButton(button, pressed) {
    return symbols.x11_mouse_button(button, pressed) === 0;
  }

  mouseWheel(horizontal, vertical) {
    return symbols.x11_mouse_wheel(horizontal, vertical) === 0;
  }

  keyRaw(keycode, pressed) {
    return symbols.x11_key_raw(keycode, pressed) === 0;
  }

  key(keycode, modifiers, pressed) {
    return symbols.x11_key(keycode, modifiers, pressed) === 0;
  }

  keyReleaseAll(ctx) {
    return symbols.x11_key_release_all() === 0;
  }

  idleInhibit(inhibit) {
    return symbols.x11_idle_inhibit(inhibit ? 1 : 0) === 0;
  }

  haveClipboard() {
    try {
      return Bun.spawnSync(['xclip', '-version']).exitCode === 0;
    } catch (error) {
      console.error('Error checking xclip:', error);
      return false;
    }
  }

  clipboardCopy(isPrimary, data, length) {
    try {
      const args = ['xclip', '-i'];
      if (isPrimary) {
        args.push('-selection', 'primary');
      } else {
        args.push('-selection', 'clipboard');
      }
      
      const proc = Bun.spawn({ cmd: args, stdin: 'pipe' });
      proc.stdin.write(data.slice(0, length));
      proc.stdin.end();
      return true;
    } catch (error) {
      console.error('Error using xclip:', error);
      return false;
    }
  }
  
  clipboardPaste(isPrimary) {
    try {
      const args = ['xclip', '-o'];
      if (isPrimary) {
        args.push('-selection', 'primary');
      } else {
        args.push('-selection', 'clipboard');
      }
      
      const result = Bun.spawnSync(args);
      if (result.exitCode === 0) {
        return result.stdout.toString();
      }
      return '';
    } catch (error) {
      console.error('Error using xclip -o:', error);
      return '';
    }
  }

  setEnv(key, value) {
    return symbols.x11_set_env(Buffer.from(`${key}\0`), Buffer.from(`${value}\0`)) === 0;
  }

  unsetEnv(key) {
    return symbols.x11_unset_env(Buffer.from(`${key}\0`)) === 0;
  }
}

DisplayServer.X11 = X11;
