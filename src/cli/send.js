import { commands } from "../commands.js";
import { green, error, reset, message } from '../colors.js';

export const send = {
  command: "send [port] [msg]",
  description: "Send a message to a peer instance",
  handler: async ([portStr, message]) => {
    try {
      if (await commands.sendMessage({ port: parseInt(portStr), message })) {
        console.log(`${message} Sent message to peer on port ${portStr}${reset}`);
      } else {
        process.exit(1);
      }
    } catch (error) {
      console.error(`${error} Failed to send message:`, error);
      process.exit(1);
    }
  }
}; 