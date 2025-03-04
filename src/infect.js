import { $ } from "bun";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { getAuthToken } from "./lib";
import { state } from "./state.js";
import { red, green, cyan, reset, error, success, info, pkg, key, upload, sparkles, warning } from './colors.js';

const REMOTE_DIR = "~/.local/bzzwrd";
const REQUIRED_PACKAGES = ["bun", "git", "tar", "gzip"];

// Progress bar helper
function renderProgressBar(progress, width = 30) {
  const filled = Math.round(width * (progress / 100));
  const empty = width - filled;
  return `[${'▇'.repeat(filled)}${'-'.repeat(empty)}] ${progress}%`;
}

async function parseSSHTarget(target, identityFile = null) {
  const match = target.match(/^(?:([^@]+)@)?([^:]+)(?::(\d+))?$/);
  if (!match) {
    throw new Error("Invalid SSH target. Format: [user@]host[:port]");
  }

  const [_, user = process.env.USER, host, port = "22"] = match;
  const sshOptions = [
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-p", port
  ].filter(Boolean);

  if (identityFile) {
    if (!existsSync(identityFile)) {
      throw new Error(`Identity file not found: ${identityFile}`);
    }
    sshOptions.push("-i", identityFile);
  }

  return {
    user,
    host,
    port,
    target: `${user}@${host}`,
    sshOptions
  };
}

async function ensureLocalInstance() {
  try {
    // Check if local instance is running
    const isRunning = await $`lsof -i:${state.port} -t`.quiet().then(() => true).catch(() => false);
    
    if (!isRunning) {
      console.log(`${pkg} Starting local instance...`);
      const proc = Bun.spawn(["bun", "src/cli.js", "spawn"], {
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          USER: process.env.USER,
          SHELL: process.env.SHELL
        }
      });
      // Wait for startup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error(`${error} Failed to check/start local instance:`, error);
    throw error;
  }
}

async function packRepo() {
  const files = [
    "scripts/",
    "src/",
    "package.json"
  ];

  // First create archive in memory to get size
  const archiveBuffer = await $`tar czf - ${files}`.bytes();
  
  // Now create streaming version for upload
  const tarProc = Bun.spawn(["tar", "czf", "-", ...files], {
    stdout: "pipe",
    stderr: "pipe"
  });

  return { proc: tarProc, size: archiveBuffer.length };
}

async function ensureRemoteDependencies(ssh) {
  try {
    console.log(`${key} Connecting to ${ssh.target}`);
    await $`ssh ${["-p", ssh.port]} ${ssh.target} "echo ok"`.quiet();

    const checkScript = `
      missing=()
      for pkg in ${REQUIRED_PACKAGES.join(" ")}; do
        if ! command -v $pkg >/dev/null 2>&1; then
          missing+=($pkg)
        fi
      done
      
      if [ \${#missing[@]} -gt 0 ]; then
        echo "Installing missing packages: \${missing[*]}" >&2
        sudo apt-get update && sudo apt-get install -y \${missing[*]}
        if [ $? -ne 0 ]; then
          echo "Failed to install: \${missing[*]}" >&2
          exit 1
        fi
      fi
    `;

    await $`ssh ${["-p", ssh.port]} ${ssh.target} ${checkScript}`;
  } catch (error) {
    if (error.stderr) {
      throw new Error(`SSH connection failed:\n${error.stderr.toString().trim()}`);
    }
    throw error;
  }
}

async function deployToRemote(ssh, archive) {
  try {
    const sshProc = Bun.spawn(["ssh", "-p", ssh.port, ssh.target, `mkdir -p ${REMOTE_DIR} && cd ${REMOTE_DIR} && tar xzf -`], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe"
    });

    // Track progress
    let uploaded = 0;
    const totalSize = archive.size;

    // Read from tar output and write to SSH stdin
    for await (const chunk of archive.proc.stdout) {
      await sshProc.stdin.write(chunk);
      uploaded += chunk.length;
      
      // Update progress bar
      const progress = Math.min(100, Math.round((uploaded / totalSize) * 100));
      process.stdout.write(`\r${upload} Uploading: ${renderProgressBar(progress)}`);
    }

    // Close stdin to signal we're done writing
    sshProc.stdin.end();
    process.stdout.write("\n");

    // Wait for SSH process to complete
    const exitCode = await sshProc.exited;
    if (exitCode !== 0) {
      const stderr = [];
      for await (const chunk of sshProc.stderr) {
        stderr.push(chunk);
      }
      throw new Error(`Transfer failed:\n${Buffer.concat(stderr).toString()}`);
    }
    
    // Run setup silently
    const setupScript = `
      cd ${REMOTE_DIR} &&
      bun install >/dev/null 2>&1 &&
      bun link >/dev/null 2>&1
    `;
    
    await $`ssh ${["-p", ssh.port]} ${ssh.target} ${setupScript}`.quiet();
  } catch (error) {
    if (error.stderr) {
      throw new Error(`Deployment failed:\n${error.stderr.toString().trim()}`);
    }
    throw error;
  }
}

async function startRemoteInstance(ssh, authToken, debug = false) {
  try {
    // Setup auth
    if (debug) {
      console.debug(`${info} Using auth token: ${cyan}${authToken}${reset}`);
    }
    await $`ssh ${["-p", ssh.port]} ${ssh.target} "mkdir -p ~/.bzzwrd && echo '${JSON.stringify({token: authToken})}' > ~/.bzzwrd/auth.json"`.quiet();
    
    // Get source IP
    const sourceIP = await $`hostname -I | cut -d' ' -f1`.text();
    
    // Start new instance and connect back to source
    const startScript = `
      cd ${REMOTE_DIR}
      ${debug ? 'DEBUG=1 ' : ''}nohup bun src/cli.js spawn ${debug ? '2>&1 | tee -a ~/.bzzwrd/debug.log' : '>/dev/null 2>&1'} &
      sleep 2
      ${debug ? 'echo "=== Remote Peer Debug Log ===" && ' : ''}${debug ? `echo "Auth token: ${authToken}" && ` : ''}bun src/cli.js connect ${sourceIP.trim()} ${debug ? '2>&1 | tee -a ~/.bzzwrd/debug.log' : ''}
      ${debug ? 'sleep 1 && bun src/cli.js send "Test mouse move" && sleep 1 && bun src/cli.js send "Moving mouse..." && tail -f ~/.bzzwrd/debug.log' : ''}
    `;
    
    await $`ssh ${["-p", ssh.port]} ${ssh.target} ${startScript}`;
  } catch (error) {
    const errorMsg = error.stderr?.toString().trim() || error.message;
    throw new Error(`Failed to start remote instance:\n${errorMsg}`);
  }
}

async function verifyRemoteInstance(ssh) {
  // No need for verification since we test actual connection via mirroring
  return true;
}

export async function infect(target, identityFile = null, debug = false) {
  try {
    const ssh = await parseSSHTarget(target, identityFile);
    
    // Pack the repository
    console.log(`${pkg} Creating archive...`);
    const archive = await packRepo();
    
    // Setup and deploy
    await ensureRemoteDependencies(ssh);
    await deployToRemote(ssh, archive);
    
    // Start and verify remote instance
    console.log(`${pkg} Starting remote instance...`);
    const authToken = await getAuthToken();
    await startRemoteInstance(ssh, authToken, debug);
    await verifyRemoteInstance(ssh);
    
    console.log(`${sparkles} Successfully infected ${cyan}${ssh.target}${reset}`);
    return true;
  } catch (error) {
    console.error(`${error} Infection failed:`);
    console.error(error.message);
    return false;
  }
}