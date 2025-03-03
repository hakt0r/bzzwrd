/**
 * Base DisplayServer class that defines the common interface for all display server implementations.
 */
export class DisplayServer {
  /**
   * Creates a new context for the display server.
   * @returns {Object} The created context
   */
  contextNew() {
    throw new Error('Method not implemented');
  }

  /**
   * Frees a previously created context.
   * @param {Object} ctx The context to free
   */
  contextFree(ctx) {
    throw new Error('Method not implemented');
  }

  /**
   * Sets up the display server with the given dimensions.
   * @param {Object} ctx The context to set up
   * @param {number} width The width of the display
   * @param {number} height The height of the display
   * @param {string|null} backend Optional backend specification
   * @returns {boolean} Whether setup was successful
   */
  setup(ctx, width, height, backend = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Closes the display server context.
   * @param {Object} ctx The context to close
   * @returns {boolean} Whether closing was successful
   */
  close(ctx) {
    throw new Error('Method not implemented');
  }

  /**
   * Prepares the file descriptor for the display server.
   * @param {Object} ctx The context
   * @returns {number} The file descriptor
   */
  prepareFd(ctx) {
    throw new Error('Method not implemented');
  }

  /**
   * Flushes the display buffer.
   * @param {Object} ctx The context
   * @returns {boolean} Whether flushing was successful
   */
  displayFlush(ctx) {
    throw new Error('Method not implemented');
  }

  /**
   * Moves the mouse cursor to the given absolute position.
   * @param {Object} ctx The context
   * @param {number} x The x coordinate
   * @param {number} y The y coordinate
   * @returns {boolean} Whether the operation was successful
   */
  mouseMotion(ctx, x, y) {
    throw new Error('Method not implemented');
  }

  /**
   * Moves the mouse cursor by the given relative amount.
   * @param {Object} ctx The context
   * @param {number} dx The x delta
   * @param {number} dy The y delta
   * @returns {boolean} Whether the operation was successful
   */
  mouseRelativeMotion(ctx, dx, dy) {
    throw new Error('Method not implemented');
  }

  /**
   * Simulates a mouse button press or release.
   * @param {Object} ctx The context
   * @param {number} button The button number (1 = left, 2 = middle, 3 = right)
   * @param {number} pressed Whether the button is pressed (1) or released (0)
   * @returns {boolean} Whether the operation was successful
   */
  mouseButton(ctx, button, pressed) {
    throw new Error('Method not implemented');
  }

  /**
   * Simulates mouse wheel scrolling.
   * @param {Object} ctx The context
   * @param {number} horizontal Horizontal scroll amount
   * @param {number} vertical Vertical scroll amount
   * @returns {boolean} Whether the operation was successful
   */
  mouseWheel(ctx, horizontal, vertical) {
    throw new Error('Method not implemented');
  }

  /**
   * Simulates a raw key press or release.
   * @param {Object} ctx The context
   * @param {number} keycode The keycode
   * @param {number} pressed Whether the key is pressed (1) or released (0)
   * @returns {boolean} Whether the operation was successful
   */
  keyRaw(ctx, keycode, pressed) {
    throw new Error('Method not implemented');
  }

  /**
   * Simulates a key press or release with modifiers.
   * @param {Object} ctx The context
   * @param {number} keycode The keycode
   * @param {number} modifiers The modifier keys
   * @param {number} pressed Whether the key is pressed (1) or released (0)
   * @returns {boolean} Whether the operation was successful
   */
  key(ctx, keycode, modifiers, pressed) {
    throw new Error('Method not implemented');
  }

  /**
   * Releases all pressed keys.
   * @param {Object} ctx The context
   * @returns {boolean} Whether the operation was successful
   */
  keyReleaseAll(ctx) {
    throw new Error('Method not implemented');
  }

  /**
   * Inhibits or allows the display server to enter idle state.
   * @param {Object} ctx The context
   * @param {boolean} inhibit Whether to inhibit idle
   * @returns {boolean} Whether the operation was successful
   */
  idleInhibit(ctx, inhibit) {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if clipboard functionality is available.
   * @returns {boolean} Whether clipboard is available
   */
  haveClipboard() {
    throw new Error('Method not implemented');
  }

  /**
   * Copies data to the clipboard.
   * @param {number} isPrimary Whether to use the primary selection (1) or not (0)
   * @param {Uint8Array} data The data to copy
   * @param {number} length The length of the data
   * @returns {boolean} Whether the operation was successful
   */
  clipboardCopy(isPrimary, data, length) {
    throw new Error('Method not implemented');
  }
}

/**
 * X11 implementation of the DisplayServer.
 */
export class X11DisplayServer extends DisplayServer {
  constructor() {
    super();
    // Dynamically import the X11 functions
    this.x11 = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    try {
      this.x11 = await import('../x11/_x11.js');
      this.initialized = true;
      return true;
    } catch (e) {
      console.error('Failed to initialize X11:', e);
      return false;
    }
  }

  contextNew() {
    return this.x11.x11ContextNew();
  }

  contextFree(ctx) {
    return this.x11.x11ContextFree(ctx);
  }

  setup(ctx, width, height) {
    return this.x11.x11Setup(ctx, width, height);
  }

  close(ctx) {
    return this.x11.x11Close(ctx);
  }

  prepareFd(ctx) {
    return this.x11.x11PrepareFd();
  }

  displayFlush(ctx) {
    return this.x11.x11DisplayFlush();
  }

  mouseMotion(ctx, x, y) {
    return this.x11.x11MouseMotion(ctx, x, y);
  }

  mouseRelativeMotion(ctx, dx, dy) {
    return this.x11.x11MouseRelativeMotion(ctx, dx, dy);
  }

  mouseButton(ctx, button, pressed) {
    return this.x11.x11MouseButton(ctx, button, pressed);
  }

  mouseWheel(ctx, horizontal, vertical) {
    return this.x11.x11MouseWheel(ctx, horizontal, vertical);
  }

  keyRaw(ctx, keycode, pressed) {
    return this.x11.x11KeyRaw(ctx, keycode, pressed);
  }

  key(ctx, keycode, modifiers, pressed) {
    return this.x11.x11Key(ctx, keycode, modifiers, pressed);
  }

  keyReleaseAll(ctx) {
    return this.x11.x11KeyReleaseAll(ctx);
  }

  idleInhibit(ctx, inhibit) {
    return this.x11.x11IdleInhibit(ctx, inhibit);
  }

  haveClipboard() {
    return this.x11.clipHaveX11Clipboard();
  }

  clipboardCopy(isPrimary, data, length) {
    return this.x11.clipX11Copy(isPrimary, data, length);
  }
}

/**
 * Wayland implementation of the DisplayServer.
 */
export class WaylandDisplayServer extends DisplayServer {
  constructor() {
    super();
    // Dynamically import the Wayland functions
    this.wayland = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    try {
      this.wayland = await import('../wayland/_wayland.js');
      this.initialized = true;
      return true;
    } catch (e) {
      console.error('Failed to initialize Wayland:', e);
      return false;
    }
  }

  contextNew() {
    return this.wayland.wlContextNew();
  }

  contextFree(ctx) {
    return this.wayland.wlContextFree(ctx);
  }

  setup(ctx, width, height, backend = null) {
    return this.wayland.wlSetup(ctx, width, height, backend);
  }

  close(ctx) {
    return this.wayland.wlClose(ctx);
  }

  prepareFd(ctx) {
    return this.wayland.wlPrepareFd(ctx);
  }

  displayFlush(ctx) {
    return this.wayland.wlDisplayFlush(ctx);
  }

  mouseMotion(ctx, x, y) {
    return this.wayland.wlMouseMotion(ctx, x, y);
  }

  mouseRelativeMotion(ctx, dx, dy) {
    return this.wayland.wlMouseRelativeMotion(ctx, dx, dy);
  }

  mouseButton(ctx, button, pressed) {
    return this.wayland.wlMouseButton(ctx, button, pressed);
  }

  mouseWheel(ctx, horizontal, vertical) {
    return this.wayland.wlMouseWheel(ctx, horizontal, vertical);
  }

  keyRaw(ctx, keycode, pressed) {
    return this.wayland.wlKeyRaw(ctx, keycode, pressed);
  }

  key(ctx, keycode, modifiers, pressed) {
    return this.wayland.wlKey(ctx, keycode, modifiers, pressed);
  }

  keyReleaseAll(ctx) {
    return this.wayland.wlKeyReleaseAll(ctx);
  }

  idleInhibit(ctx, inhibit) {
    return this.wayland.wlIdleInhibit(ctx, inhibit);
  }

  haveClipboard() {
    return this.wayland.clipHaveWlClipboard();
  }

  clipboardCopy(isPrimary, data, length) {
    return this.wayland.clipWlCopy(isPrimary, data, length);
  }
}

/**
 * Factory function that creates the appropriate DisplayServer implementation
 * based on environment detection.
 * @returns {Promise<DisplayServer>} A Promise that resolves to the appropriate DisplayServer implementation
 */
export async function createDisplayServer() {
  // Try Wayland first (if WAYLAND_DISPLAY env var is set)
  if (process.env.WAYLAND_DISPLAY) {
    const waylandServer = new WaylandDisplayServer();
    const success = await waylandServer.initialize();
    if (success) {
      console.log('Using Wayland display server');
      return waylandServer;
    }
  }

  // Fall back to X11
  const x11Server = new X11DisplayServer();
  const success = await x11Server.initialize();
  if (success) {
    console.log('Using X11 display server');
    return x11Server;
  }

  // Neither Wayland nor X11 is available
  throw new Error('No supported display server found');
}

/**
 * Synchronous version of the factory function for environments 
 * where async initialization isn't suitable.
 * Note: This will not perform dynamic imports, so modules should be 
 * imported separately before using this.
 * @returns {DisplayServer} The appropriate DisplayServer implementation
 */
export function createDisplayServerSync() {
  // Try Wayland first (if WAYLAND_DISPLAY env var is set)
  if (process.env.WAYLAND_DISPLAY) {
    try {
      // Here we'd check if the wayland module is available
      // Since we can't do dynamic imports synchronously, this is a best-effort check
      if (typeof wlContextNew === 'function') {
        const waylandServer = new WaylandDisplayServer();
        waylandServer.initialized = true;
        waylandServer.wayland = global; // Use globally imported functions
        console.log('Using Wayland display server (sync)');
        return waylandServer;
      }
    } catch (e) {
      // Continue to X11
    }
  }

  // Fall back to X11
  try {
    // Here we'd check if the X11 module is available
    if (typeof x11ContextNew === 'function') {
      const x11Server = new X11DisplayServer();
      x11Server.initialized = true;
      x11Server.x11 = global; // Use globally imported functions
      console.log('Using X11 display server (sync)');
      return x11Server;
    }
  } catch (e) {
    // Neither is available
  }

  throw new Error('No supported display server found');
} 