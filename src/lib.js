import { $ } from "bun";
import { join } from "node:path";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { cyan, info, pkg, reset } from './colors.js';

const CONFIG_DIR = join(process.env.HOME || process.env.USERPROFILE, ".bzzwrd");
const AUTH_FILE = join(CONFIG_DIR, "auth.json");

// Dependency management
const DEPS = {
  "bun": {
    binary: "bun",
    check: "command -v bun",
    customInstall: "curl -fsSL https://bun.sh/install | bash && source ~/.bashrc",
    message: "Installing Bun runtime..."
  },
  "lsof": {
    binary: "lsof",
    check: "command -v lsof",
    packages: ["lsof", "procps"],
    message: "Installing system utilities..."
  },
  "tar": {
    binary: "tar",
    check: "command -v tar",
    packages: ["tar"],
    message: "Installing tar..."
  },
  "gzip": {
    binary: "gzip",
    check: "command -v gzip",
    packages: ["gzip"],
    message: "Installing gzip..."
  },
  "git": {
    binary: "git",
    check: "command -v git",
    packages: ["git"],
    message: "Installing git..."
  }
};

// Cache for binary checks
const binaryCache = new Map();

async function checkBinary(binary) {
  if (binaryCache.has(binary)) {
    return binaryCache.get(binary);
  }
  try {
    await $`command -v ${binary}`.quiet();
    binaryCache.set(binary, true);
    return true;
  } catch {
    binaryCache.set(binary, false);
    return false;
  }
}

// Check and install dependencies
export async function ensureDependencies() {
  const missing = [];
  const aptPackages = new Set();
  const customInstalls = [];

  // Check which dependencies are missing
  for (const [name, dep] of Object.entries(DEPS)) {
    if (!await checkBinary(dep.binary)) {
      missing.push(name);
      if (dep.packages) {
        dep.packages.forEach(pkg => aptPackages.add(pkg));
      }
      if (dep.customInstall) {
        customInstalls.push(dep);
      }
    }
  }

  if (missing.length > 0) {
    console.log(`${info} Missing dependencies: ${cyan}${missing.join(", ")}${reset}`);
    const shouldInstall = await new Promise(resolve => {
      console.log("Would you like to install them? [y/N]");
      process.stdin.once('data', data => {
        resolve(data.toString().trim().toLowerCase() === 'y');
      });
    });

    if (!shouldInstall) {
      console.error("Cannot proceed without required dependencies");
      process.exit(1);
    }

    try {
      // Install apt packages if any
      if (aptPackages.size > 0) {
        const packages = Array.from(aptPackages);
        console.log(`${pkg} Installing packages: ${cyan}${packages.join(", ")}${reset}...`);
        await $`sudo apt-get update`.quiet();
        await $`sudo apt-get install -y ${packages}`.quiet();
      }

      // Run custom installations
      for (const dep of customInstalls) {
        console.log(dep.message || `${pkg} Installing ${cyan}${dep.binary}${reset}...`);
        await $`bash -c ${dep.customInstall}`.quiet();
      }

      // Clear binary cache after installations
      binaryCache.clear();
    } catch (error) {
      console.error("Failed to install dependencies:", error);
      throw error;
    }
  }
}

// Auth token management
export function getAuthToken() {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (existsSync(AUTH_FILE)) {
      const auth = JSON.parse(readFileSync(AUTH_FILE, "utf8"));
      return auth.token;
    }
    const token = randomBytes(32).toString("hex");
    writeFileSync(AUTH_FILE, JSON.stringify({ token }, null, 2));
    return token;
  } catch (error) {
    console.error("Failed to manage auth token:", error);
    throw error;
  }
}

// Process management
export async function findProcess(pattern) {
  try {
    const { stdout } = await $`pgrep -f ${pattern}`.quiet();
    return stdout.trim().split("\n").filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

export async function killProcess(pattern) {
  const pids = await findProcess(pattern);
  if (pids.length > 0) {
    await $`kill ${pids}`.quiet();
    return true;
  }
  return false;
}

// Network utilities
export async function isPortInUse(port) {
  try {
    await $`lsof -i:${port} -t`.quiet();
    return true;
  } catch {
    return false;
  }
}

export async function waitForPort(port, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await isPortInUse(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

// File system utilities
export async function ensureDirectory(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
} 