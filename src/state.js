import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { red, error, reset } from './colors.js';

// Default configuration
const defaults = {
  port: 12345,
  configDir: join(homedir(), ".config", "bzzwrd"),
  stateFile: "state.json",
  authFile: "auth.json"
};

// Ensure config directory exists
if (!existsSync(defaults.configDir)) {
  mkdirSync(defaults.configDir, { recursive: true });
}

class State {
  constructor() {
    this.configPath = join(defaults.configDir, defaults.stateFile);
    this.load();
  }

  load() {
    try {
      if (existsSync(this.configPath)) {
        const data = JSON.parse(readFileSync(this.configPath, 'utf8'));
        this.data = { ...defaults, ...data };
      } else {
        this.data = { ...defaults };
        this.save();
      }
    } catch (error) {
      console.error(`${error} Failed to load state: ${red}${error}${reset}`);
      this.data = { ...defaults };
    }
  }

  save() {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error(`${error} Failed to save state: ${red}${error}${reset}`);
    }
  }

  get port() {
    return this.data.port;
  }

  set port(value) {
    this.data.port = value;
    this.save();
  }

  get configDir() {
    return this.data.configDir;
  }

  get authFile() {
    return join(this.configDir, this.data.authFile);
  }
}

// Export singleton instance
export const state = new State(); 