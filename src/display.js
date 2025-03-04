export class DisplayServer {
  contextNew() {
    throw new Error('Method not implemented');
  }

  contextFree(ctx) {
    throw new Error('Method not implemented');
  }

  setup(ctx, width, height, backend = null) {
    throw new Error('Method not implemented');
  }

  close(ctx) {
    throw new Error('Method not implemented');
  }

  prepareFd(ctx) {
    throw new Error('Method not implemented');
  }

  displayFlush(ctx) {
    throw new Error('Method not implemented');
  }

  mouseMotion(ctx, x, y) {
    throw new Error('Method not implemented');
  }

  mouseRelativeMotion(ctx, dx, dy) {
    throw new Error('Method not implemented');
  }

  mouseButton(ctx, button, pressed) {
    throw new Error('Method not implemented');
  }

  mouseWheel(ctx, horizontal, vertical) {
    throw new Error('Method not implemented');
  }

  keyRaw(ctx, keycode, pressed) {
    throw new Error('Method not implemented');
  }

  key(keycode, modifiers, pressed) {
    throw new Error('Method not implemented');
  }

  keyReleaseAll() {
    throw new Error('Method not implemented');
  }

  idleInhibit(inhibit) {
    throw new Error('Method not implemented');
  }

  haveClipboard() {
    throw new Error('Method not implemented');
  }

  clipboardCopy(isPrimary, data, length) {
    throw new Error('Method not implemented');
  }

  static create(force = null) {
    if (process.env.WAYLAND_DISPLAY && force !== 'x11') return new DisplayServer.Wayland();
    return new DisplayServer.X11();
  }
}