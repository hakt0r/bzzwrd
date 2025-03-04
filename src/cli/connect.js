import { commands } from "../commands.js";
import { red, cyan, error, plug, sparkles, info, reset } from '../colors.js';

export const connect = {
  command: "connect <host>",
  description: "Connect to a remote host",
  handler: async ([host]) => {
    if (!host) {
      console.error(`${error} Missing host argument`);
      process.exit(1);
    }

    console.log(`${plug} Connecting to ${cyan}${host}${reset}...`);
    const peer = await commands.spawnPeer({ port: 0 });
    await peer.connect(host);

    // Test mouse movement in debug mode
    if (process.env.DEBUG) {
      console.debug(`${info} Testing mouse movement...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await peer.broadcast("mouse_move", { dx: 50, dy: 0 });
      await new Promise(resolve => setTimeout(resolve, 500));
      await peer.broadcast("mouse_move", { dx: 0, dy: 50 });
      await new Promise(resolve => setTimeout(resolve, 500));
      await peer.broadcast("mouse_move", { dx: -50, dy: -50 });
    }

    // Keep process alive
    process.on("SIGINT", () => {
      peer.cleanup();
      process.exit(0);
    });

    await new Promise(() => {});
  }
}; 