import { commands } from "../commands.js";
import { rocket, mouse, error, info, warning } from '../colors.js';
import { MouseTracker } from "../tracker.js";

export const spawn = {
  command: "spawn",
  description: "Spawn a new peer instance",
  handler: async ([port]) => {
    const peer = await commands.spawnPeer({ port: Number.parseInt(port) });
    console.log(`${rocket} Spawned peer on port ${port || peer.port}`);

    let tracker = null;

    // Only try to initialize mouse tracking if we're in an X11 session
    if (process.env.DISPLAY) {
      try {
        tracker = new MouseTracker(peer);
        await tracker.start();
        console.log(`${mouse} Mouse tracking started`);
      } catch (err) {
        if (process.env.DEBUG) {
          console.debug(`${warning} Mouse tracking disabled: ${err.message}`);
          console.debug(`${info} X11 Display: ${process.env.DISPLAY}`);
        }
      }
    } else if (process.env.DEBUG) {
      console.debug(`${warning} No X11 display available, mouse tracking disabled`);
    }

    // Keep process alive
    process.on("SIGINT", () => {
      if (tracker) {
        tracker.stop();
      }
      peer.cleanup();
      process.exit(0);
    });

    await new Promise(() => {});
  }
}; 