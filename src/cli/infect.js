import { commands, ensureLocalInstance } from "../commands.js";
import { infect as infectHost } from "../infect.js";
import { red, error } from '../colors.js';

export const infect = {
  command: "infect [target]",
  description: "Infect a remote host via SSH\n                     Format: [user@]host[:port] [-i identity_file] [-d]",
  handler: async ([target, ...args]) => {
    if (!target) {
      console.error(`${error} Missing target. Format: [user@]host[:port] [-i identity_file] [-d]`);
      process.exit(1);
    }
    
    const identityFile = args.indexOf("-i") > -1 ? args[args.indexOf("-i") + 1] : null;
    const debug = args.includes("-d");
    
    // Ensure we have a local instance running
    await ensureLocalInstance();
    
    try {
      if (!await infectHost(target, identityFile, debug)) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`${error} Infection failed:`, error);
      process.exit(1);
    }
  }
}; 