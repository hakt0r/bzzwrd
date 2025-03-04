import { X11 } from './x11/index.js';
import { gray, info } from './colors.js';

export class MouseTracker {
  constructor(peer) {
    this.peer = peer;
    this.display = null;
    this.lastX = 0;
    this.lastY = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragging = false;
    this.lastButtons = {};
  }

  async start() {
    if (!process.env.DISPLAY) {
      throw new Error('No X11 display available');
    }

    try {
      this.display = new X11();

      if (process.env.DEBUG) {
        const screens = this.display.getScreens();
        console.debug(`${info} X11 display initialized: ${process.env.DISPLAY}`);
        console.debug(`${info} Screen resolution: ${screens[0].width}x${screens[0].height}`);
      }

      this.tracking = true;
      this.poll();
    } catch (error) {
      throw new Error(`Failed to initialize X11 display: ${error.message}`);
    }
  }

  async poll() {
    while (this.tracking) {
      try {
        const pos = this.display.getMousePosition();
        if (!pos) continue;

        if (pos.dx !== 0 || pos.dy !== 0) {
          if (process.env.DEBUG) {
            console.debug(
              `${gray}Broadcasting mouse_move: dx=${pos.dx}, dy=${pos.dy} to ${this.peer.peers.size} peers`,
            );
          }
          await this.peer.broadcast('mouse_move', { dx: pos.dx, dy: pos.dy });
        }

        for (const [button, changed] of Object.entries(pos.buttonChanges)) {
          if (changed) {
            const pressed = pos.buttons[button];
            if (pressed) {
              if (process.env.DEBUG) {
                console.debug(`${gray}Broadcasting mouse_down: ${button}`);
              }
              if (button === 'left') {
                this.dragging = true;
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;
              }
              await this.peer.broadcast('mouse_click', { button });
            } else {
              if (process.env.DEBUG) {
                console.debug(`${gray}Broadcasting mouse_up: ${button}`);
              }
              if (button === 'left' && this.dragging) {
                if (process.env.DEBUG) {
                  console.debug(
                    `${gray}Broadcasting mouse_drag: dx=${pos.x - this.dragStartX}, dy=${pos.y - this.dragStartY}`,
                  );
                }
                await this.peer.broadcast('mouse_drag', {
                  x: pos.x - this.dragStartX,
                  y: pos.y - this.dragStartY,
                });
                this.dragging = false;
              }
              await this.peer.broadcast('mouse_click', { button });
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 16));
      } catch (error) {
        if (process.env.DEBUG) {
          console.debug(`${gray}Mouse polling error: ${error.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  stop() {
    this.tracking = false;
    if (this.display) {
      this.display.cleanup();
      this.display = null;
    }
  }
}
