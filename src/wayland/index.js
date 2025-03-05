import { cc } from 'bun:ffi';
import { DisplayServer } from '../display.js';

const { symbols } = cc({
  source: [
    './src/wayland/wl_idle.c',
    './src/wayland/wl_idle_gnome.c',
    './src/wayland/wl_idle_kde.c',
    './src/wayland/wl_idle_ext.c',
    './src/wayland/wl_input.c',
    './src/wayland/wl_input_wlr.c',
    './src/wayland/wl_input_kde.c',
    './src/wayland/wl_input_uinput.c',
    './src/wayland/os.c',
    './src/wayland/wayland.c',
    './src/wayland/protocol/generated/idle-protocol.c',
    './src/wayland/protocol/generated/ext-idle-notify-v1-protocol.c',
    './src/wayland/protocol/generated/fake-input-protocol.c',
    './src/wayland/protocol/generated/keyboard-shortcuts-inhibit-unstable-v1-protocol.c',
    './src/wayland/protocol/generated/virtual-keyboard-unstable-v1-protocol.c',
    './src/wayland/protocol/generated/wlr-virtual-pointer-unstable-v1-protocol.c',
    './src/wayland/protocol/generated/xdg-output-unstable-v1-protocol.c',
    './src/wayland/protocol/generated/xdg-shell-protocol.c',
  ],
  include: ['src/wayland/include', 'src/wayland/protocol/generated'],
  system_include: [
    '/usr/include',
    '/usr/include/x86_64-linux-gnu',
    '/usr/local/include',
    '/usr/lib/x86_64-linux-gnu/glib-2.0/include',
    '/usr/include/glib-2.0',
    '/usr/lib/gcc/x86_64-linux-gnu/13/include',
  ],
  define: {
    __USE_GNU: '1',
    _GNU_SOURCE: '1',
  },
  cflags: ['-std=gnu2x'],
  library: ['wayland-client', 'xkbcommon', 'wlroots-0.18'],
  symbols: {
    wlContextNew: {
      args: [],
      returns: 'ptr',
    },
    wlContextFree: {
      args: ['ptr'],
      returns: 'void',
    },
    wlSetup: {
      args: ['ptr', 'i32', 'i32', 'ptr'],
      returns: 'bool',
    },
    wlClose: {
      args: ['ptr'],
      returns: 'void',
    },
    wlPrepareFd: {
      args: ['ptr'],
      returns: 'i32',
    },
    wlDisplayFlush: {
      args: ['ptr'],
      returns: 'void',
    },
    wlMouseMotion: {
      args: ['ptr', 'i32', 'i32'],
      returns: 'void',
    },
    wlMouseRelativeMotion: {
      args: ['ptr', 'i32', 'i32'],
      returns: 'void',
    },
    wlMouseButton: {
      args: ['ptr', 'i32', 'i32'],
      returns: 'void',
    },
    wlMouseWheel: {
      args: ['ptr', 'i16', 'i16'],
      returns: 'void',
    },
    wlKeyRaw: {
      args: ['ptr', 'i32', 'i32'],
      returns: 'void',
    },
    wlKey: {
      args: ['ptr', 'i32', 'i32', 'i32'],
      returns: 'void',
    },
    wlKeyReleaseAll: {
      args: ['ptr'],
      returns: 'void',
    },
    wlIdleInhibit: {
      args: ['ptr', 'bool'],
      returns: 'void',
    },
    osSetEnv: {
      args: ['ptr', 'ptr'],
      returns: 'i32',
    },
    osUnsetEnv: {
      args: ['ptr'],
      returns: 'i32',
    },
  },
});

export class Wayland extends DisplayServer {
  constructor() {
    super();
    this.initialized = true;
    this.contextNew();
  }

  contextNew() {
    this.ptr = symbols.wlContextNew();
    if (this.ptr === 0) throw new Error('Failed to create wayland context');
    this.compositor = detectCompositor();
    this.width = 0;
    this.height = 0;
  }
  
  contextFree() {
    symbols.wlContextFree(this.ptr);
  }
  
  setup( width, height, backend = null) {
    const result = symbols.wlSetup(this.ptr, width, height, null);
    if (result) {
      this.width = width;
      this.height = height;
    }
    return result;
  }
  
  close() {
    symbols.wlClose(this.ptr);
    return true;
  }
  
  prepareFd() {
    return symbols.wlPrepareFd(this.ptr);
  }
  
  displayFlush() {
    symbols.wlDisplayFlush(this.ptr);
    return true;
  }
  
  mouseMotion(x, y) {
    symbols.wlMouseMotion(this.ptr, x, y);
    return true;
  }
  
  mouseRelativeMotion(dx, dy) {
    symbols.wlMouseRelativeMotion(this.ptr, dx, dy);
    return true;
  }
  
  mouseButton(button, pressed) {
    symbols.wlMouseButton(this.ptr, button, pressed);
    return true;
  }
  
  mouseWheel(horizontal, vertical) {
    symbols.wlMouseWheel(this.ptr, horizontal, vertical);
    return true;
  }
  
  keyRaw(keycode, pressed) {
    symbols.wlKeyRaw(this.ptr, keycode, pressed);
    return true;
  }
  
  key(keycode, modifiers, pressed) {
    symbols.wlKey(this.ptr, keycode, pressed, modifiers);
    return true;
  }
  
  keyReleaseAll() {
    symbols.wlKeyReleaseAll(this.ptr);
    return true;
  }
  
  idleInhibit(inhibit) {
    symbols.wlIdleInhibit(this.ptr, inhibit);
    return true;
  }
  
  haveClipboard() {
    try {
      return Bun.spawnSync(['wl-paste', '-v']).exitCode === 0 && 
             Bun.spawnSync(['wl-copy', '-v']).exitCode === 0;
    } catch (error) {
      console.error('Error checking wl-clipboard:', error);
      return false;
    }
  }
  
  clipboardCopy(isPrimary, data, length) {
    try {
      const args = ['wl-copy', '-f'];
      if (isPrimary === 1) args.push('--primary');
      const proc = Bun.spawn({ cmd: args, stdin: 'pipe' });
      proc.stdin.write(data.slice(0, length));
      proc.stdin.end();
      return true;
    } catch (error) {
      console.error('Error using wl-copy:', error);
      return false;
    }
  }

  clipboardPaste(isPrimary) {
    const args = ['wl-paste'];
    if (isPrimary === 1) args.push('--primary');
    const proc = Bun.spawn(args);
    return proc.stdout.toString();
  }

  setEnv(key, value) {
    symbols.osSetEnv(Buffer.from(`${key}\0`), Buffer.from(`${value}\0`));
  }

  unsetEnv(key) {
    symbols.osUnsetEnv(Buffer.from(`${key}\0`));
  }
}

function detectCompositor() {
  const { XDG_CURRENT_DESKTOP } = process.env;
  if (!XDG_CURRENT_DESKTOP) return 'unknown';
  
  const desktop = XDG_CURRENT_DESKTOP.toLowerCase();
  if (desktop.includes('kde')) return 'kde';
  if (desktop.includes('gnome')) return 'gnome';
  if (desktop.includes('sway') || 
      desktop.includes('hyprland') || 
      desktop.includes('wlroots')) return 'wlroots';
  
  return 'unknown';
}

DisplayServer.Wayland = Wayland;