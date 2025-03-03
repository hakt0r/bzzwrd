import { red, reset } from './colors.js';
import { $ } from 'bun';

// Detect display server and compositor
async function detectDisplayServer() {
  try {
    const env = {
      session: process.env.XDG_SESSION_TYPE?.toLowerCase(),
      desktop: process.env.XDG_CURRENT_DESKTOP?.toLowerCase(),
      wayland: process.env.WAYLAND_DISPLAY,
      display: process.env.DISPLAY,
    };

    // First check session type
    if (env.session === 'wayland') {
      // Detect specific Wayland compositor
      if (env.desktop?.includes('kde')) return 'wayland-kde';
      if (env.desktop?.includes('gnome')) return 'wayland-gnome';
      return 'wayland-wlroots'; // Default to wlroots for other Wayland compositors
    }

    if (env.session === 'x11' || env.display) {
      if (env.desktop?.includes('kde')) return 'x11-kde';
      if (env.desktop?.includes('gnome')) return 'x11-gnome';
      return 'x11'; // Default X11
    }

    // Fallback detection
    if (env.wayland) {
      if (env.desktop?.includes('kde')) return 'wayland-kde';
      if (env.desktop?.includes('gnome')) return 'wayland-gnome';
      return 'wayland-wlroots';
    }

    if (env.display) return 'x11';

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export class VirtualMouse {
  constructor() {
    this.displayServer = null;
  }

  async init() {
    try {
      // Detect display server
      this.displayServer = await detectDisplayServer();
      console.debug(`Using display server: ${this.displayServer}`);
      return true;
    } catch (error) {
      console.error(`Failed to initialize virtual mouse: ${red}${error.message}${reset}`);
      return false;
    }
  }

  async click(button) {
    try {
      // This will be implemented using Wayland protocols
      console.debug(`Click ${button} using Wayland protocols`);
      return true;
    } catch (error) {
      console.error(`Failed to click: ${red}${error.message}${reset}`);
      return false;
    }
  }

  async moveRelative(dx, dy) {
    try {
      // This will be implemented using Wayland protocols
      console.debug(`Move relative ${dx},${dy} using Wayland protocols`);
      return true;
    } catch (error) {
      console.error(`Failed to move: ${red}${error.message}${reset}`);
      return false;
    }
  }

  async dragTo(x, y) {
    try {
      // This will be implemented using Wayland protocols
      console.debug(`Drag to ${x},${y} using Wayland protocols`);
      return true;
    } catch (error) {
      console.error(`Failed to drag: ${red}${error.message}${reset}`);
      return false;
    }
  }

  async cleanup() {
    // No cleanup needed for Wayland implementation
  }

  async hideCursor() {
    try {
      switch (this.displayServer) {
        case 'wayland-kde':
          await $`qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.setShowingCursor false`.quiet();
          return true;
        case 'wayland-gnome':
          await $`gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.HideCursor`.quiet();
          return true;
        case 'wayland-wlroots':
          // wlroots compositors typically use XWayland for cursor management
          return symbols.x11_hide_cursor() === 0;
        case 'x11':
        case 'x11-kde':
        case 'x11-gnome':
          return symbols.x11_hide_cursor() === 0;
        default:
          console.debug(`Unsupported display server: ${this.displayServer}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to hide cursor: ${red}${error.message}${reset}`);
      return false;
    }
  }

  async showCursor() {
    try {
      switch (this.displayServer) {
        case 'wayland-kde':
          await $`qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.setShowingCursor true`.quiet();
          return true;
        case 'wayland-gnome':
          await $`gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.ShowCursor`.quiet();
          return true;
        case 'wayland-wlroots':
          return symbols.x11_show_cursor() === 0;
        case 'x11':
        case 'x11-kde':
        case 'x11-gnome':
          return symbols.x11_show_cursor() === 0;
        default:
          console.debug(`Unsupported display server: ${this.displayServer}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to show cursor: ${red}${error.message}${reset}`);
      return false;
    }
  }

  async lockInput() {
    try {
      switch (this.displayServer) {
        case 'wayland-kde':
          await $`qdbus org.kde.kwin /KWin org.kde.KWin.createInputCapture`.quiet();
          return true;
        case 'wayland-gnome':
          await $`gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.GrabAcceleratorKeys`.quiet();
          return true;
        case 'wayland-wlroots':
          return symbols.x11_lock_input() === 0;
        case 'x11':
        case 'x11-kde':
        case 'x11-gnome':
          return symbols.x11_lock_input() === 0;
        default:
          console.debug(`Unsupported display server: ${this.displayServer}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to lock input: ${red}${error.message}${reset}`);
      return false;
    }
  }

  async unlockInput() {
    try {
      switch (this.displayServer) {
        case 'wayland-kde':
          await $`qdbus org.kde.kwin /KWin org.kde.KWin.destroyInputCapture`.quiet();
          return true;
        case 'wayland-gnome':
          await $`gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.UngrabAcceleratorKeys`.quiet();
          return true;
        case 'wayland-wlroots':
          return symbols.x11_unlock_input() === 0;
        case 'x11':
        case 'x11-kde':
        case 'x11-gnome':
          return symbols.x11_unlock_input() === 0;
        default:
          console.debug(`Unsupported display server: ${this.displayServer}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to unlock input: ${red}${error.message}${reset}`);
      return false;
    }
  }
}
