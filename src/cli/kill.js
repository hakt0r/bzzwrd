import { commands } from "../commands.js";
import { red, yellow, reset, error, skull, timer } from '../colors.js';

export const kill = {
  command: "kill [port]",
  description: "Kill a running peer instance",
  handler: async ([portStr]) => {
    const port = parseInt(portStr);
    try {
      if (await commands.killPeer(port)) {
        console.log(`${skull} Peer on port ${port} has been terminated${reset}`);
      } else {
        console.error(`${timer} Timed out waiting for peer on port ${port} to terminate${reset}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`${error} Failed to kill peer on port ${port}:`, error);
      process.exit(1);
    }
  }
}; 