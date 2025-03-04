import { $ } from 'bun';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { red, green, yellow, cyan, reset, success, error, warning, info, pkg, sparkles, clipboard } from './colors.js';

export const DEPS = {
  bun: {
    name: 'Bun Runtime',
    binary: 'bun',
    additionalPaths: [join(homedir(), '.bun/bin')],
    customInstall: true,
    install: async () => {
      try {
        if (await commandExists('bun')) return true;

        console.log(`${pkg} Installing Bun runtime...`);
        await $`curl -fsSL https://bun.sh/install | bash`.quiet();
        console.log(`${success} Bun installed successfully`);
        console.log(`${info} Note: You may need to restart your shell`);
        return true;
      } catch (error) {
        return false;
      }
    },
  },
  lsof: {
    name: 'System Utilities',
    binary: 'lsof',
    packages: ['procps'],
    description: 'Required for port management',
  },
  tar: {
    name: 'Archive Tools',
    binary: 'tar',
    packages: ['tar'],
    description: 'Required for package management',
  },
  gzip: {
    name: 'Compression Tools',
    binary: 'gzip',
    packages: ['gzip'],
    description: 'Required for package compression',
  },
  git: {
    name: 'Git',
    binary: 'git',
    packages: ['git'],
    description: 'Required for version control',
  },
  xclip: {
    name: 'X11 Clipboard Tool',
    binary: 'xclip',
    packages: ['xclip'],
    description: 'Required for X11 clipboard support',
  },
  wl_clipboard: {
    name: 'Wayland Clipboard Tool',
    binary: 'wl-copy',
    packages: ['wl-clipboard'],
    description: 'Required for Wayland clipboard support',
  },
};

const SYSTEM_LIBS = {
  uinput: {
    name: 'User Input subsystem',
    description: 'Required for keyboard/mouse control',
    headers: ['/usr/include/linux/uinput.h'],
    modules: ['uinput'],
    packages: ['linux-headers-$(uname -r)'],
  },
  x11: {
    name: 'X11 Libraries',
    description: 'Required for X11 display management',
    headers: ['/usr/include/X11/Xlib.h'],
    packages: ['libx11-dev', 'libxfixes-dev', 'libxtst-dev', 'libxext-dev'],
  },
  wayland: {
    name: 'Wayland Libraries',
    description: 'Required for Wayland display management',
    headers: ['/usr/include/wayland-client.h'],
    packages: ['libwayland-dev', 'libxkbcommon-dev', 'libinput-dev', 'libwlroots-dev'],
  },
};

const checkCache = new Map();

async function checkBinary(binary, additionalPaths = []) {
  const cacheKey = `bin:${binary}:${additionalPaths.join(':')}`;
  if (checkCache.has(cacheKey)) {
    return checkCache.get(cacheKey);
  }

  try {
    const result = await $`which ${binary}`.quiet();
    if (result.exitCode === 0) {
      checkCache.set(cacheKey, true);
      return true;
    }
  } catch {}

  for (const path of additionalPaths) {
    try {
      const fullPath = join(path, binary);
      const result = await $`test -x ${fullPath}`.quiet();
      if (result.exitCode === 0) {
        checkCache.set(cacheKey, true);
        return true;
      }
    } catch {}
  }

  checkCache.set(cacheKey, false);
  return false;
}

async function checkKernelModule(module) {
  const cacheKey = `module:${module}`;
  if (checkCache.has(cacheKey)) {
    return checkCache.get(cacheKey);
  }

  try {
    const result = await $`lsmod | grep ^${module}`.quiet();
    const loaded = result.exitCode === 0;
    checkCache.set(cacheKey, loaded);
    return loaded;
  } catch {
    checkCache.set(cacheKey, false);
    return false;
  }
}

async function isDebianBased() {
  try {
    const result = await $`test -f /etc/debian_version`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

function formatStatus(dep) {
  const status = dep.installed ? `${success} ` : `${yellow}○${reset} `;
  const name = dep.name;
  const desc = dep.description ? ` (${dep.description})` : '';
  return `${status}${name}${desc}`;
}

async function installPackages(packages) {
  try {
    console.log(`${pkg} Installing packages: ${packages.join(', ')}`);
    await $`sudo apt-get update`.quiet();
    await $`sudo apt-get install -y ${packages}`.quiet();
    console.log(`${success} Packages installed successfully`);
    return true;
  } catch (error) {
    console.error(`${error} Failed to install packages:`, error);
    return false;
  }
}

export async function ensureDependencies({ verbose = false } = {}) {
  if (verbose) console.log(`${clipboard}\n Checking dependencies...\n`);

  const missing = [];
  const aptPackages = new Set();
  const customInstalls = [];
  const missingModules = new Set();

  for (const [key, dep] of Object.entries(DEPS)) {
    const installed = await checkBinary(dep.binary, dep.additionalPaths);
    console.log(formatStatus(dep));

    if (!installed) {
      missing.push(key);
      if (dep.packages) {
        dep.packages.forEach((pkg) => aptPackages.add(pkg));
      }
      if (dep.customInstall) {
        customInstalls.push(dep);
      }
    }
  }

  for (const [key, lib] of Object.entries(SYSTEM_LIBS)) {
    let installed = true;

    for (const header of lib.headers) {
      if (!existsSync(header)) {
        installed = false;
        lib.packages?.forEach((pkg) => aptPackages.add(pkg));
      }
    }

    if (lib.modules) {
      for (const module of lib.modules) {
        if (!(await checkKernelModule(module))) {
          installed = false;
          missingModules.add(module);
        }
      }
    }

    console.log(formatStatus(lib));
    if (!installed) missing.push(key);
  }

  if (missing.length === 0) {
    if (verbose) console.log(`${sparkles}\n All dependencies are installed!\n`);
    return true;
  }

  if (!verbose) {
    console.log(`${clipboard}\n Missing dependencies found:\n`);

    for (const key of missing) {
      const dep = DEPS[key] || SYSTEM_LIBS[key];
      console.log(formatStatus(dep));
    }
  }

  console.log(`${warning}\n Some dependencies are missing.`);
  const shouldInstall = await new Promise((resolve) => {
    process.stdout.write(`${cyan}Would you like to install them? [y/N] ${reset}`);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim().toLowerCase() === 'y');
    });
  });

  if (!shouldInstall) {
    console.error(`${error}\n Cannot proceed without required dependencies\n`);
    process.exit(1);
  }

  try {
    if (aptPackages.size > 0) {
      if (!(await isDebianBased())) {
        console.error(`${error} This system doesn't appear to be Debian-based.`);
        console.error(`${info} Please install the following packages manually:`);
        console.log(`${cyan}${[...aptPackages].join(', ')}${reset}`);
        process.exit(1);
      }

      if (!(await installPackages([...aptPackages]))) {
        return false;
      }
    }

    if (missingModules.size > 0) {
      console.log(`${pkg}\n Loading kernel modules...`);
      for (const module of missingModules) {
        try {
          await $`sudo modprobe ${module}`.quiet();
          console.log(`${success} Loaded ${module} module`);
        } catch (error) {
          console.error(`${error} Failed to load ${module} module:`, error);
          return false;
        }
      }
    }

    for (const dep of customInstalls) {
      if (!(await dep.install())) {
        return false;
      }
    }

    checkCache.clear();

    if (verbose) console.log(`${sparkles}\n All dependencies installed successfully!\n`);
    return true;
  } catch (error) {
    console.error(`${error}\n Failed to install dependencies:`, error);
    return false;
  }
}
