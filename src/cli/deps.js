import { ensureDependencies } from "../dependencies.js";

export const deps = {
  command: "deps",
  description: "Check and install system dependencies",
  handler: async () => {
    await ensureDependencies({ verbose: true });
  }
}; 