import { $ } from 'bun';
import { state } from './state';
import { Peer } from './network/peer';
import { getAuthToken } from './lib';
import { cyan, info, reset } from './colors.js';

async function isPortInUse(port) {
  return $`lsof -i:${port} -t`
    .quiet()
    .then(() => true)
    .catch(() => false);
}

export async function ensureLocalInstance() {
  if (!(await isPortInUse(state.port))) {
    console.log(`${info} Starting local instance...`);
    const proc = Bun.spawn(['bun', 'src/cli.js', 'spawn'], {
      stdio: ['inherit', 'inherit', 'inherit'],
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        USER: process.env.USER,
        SHELL: process.env.SHELL,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  }
  return true;
}

export const commands = {
  async spawnPeer({ port = state.port } = {}) {
    const peer = new Peer({
      port,
      authToken: getAuthToken(),
    });

    peer.on('auth', (data, info) => {
      if (data.token === getAuthToken()) {
        console.log(`${info} Authenticated client from ${cyan}${info.address}:${info.port}${reset}`);
        peer.authenticatedPeers.add(`${info.address}:${info.port}`);
      }
    });

    await peer.init();
    return peer;
  },

  async killPeer(port = state.port) {
    const peer = new Peer({ port: 0 });

    try {
      await peer.init();
      await peer.connect('127.0.0.1', port);
      await peer.broadcast('kill', { token: getAuthToken() });

      for (let i = 0; i < 10; i++) {
        if (!(await isPortInUse(port))) {
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      return false;
    } finally {
      peer.cleanup();
    }
  },

  async sendMessage({ port = state.port, message = 'Hello!' } = {}) {
    const peer = new Peer({ port: 0 });

    try {
      await peer.init();
      await peer.connect('127.0.0.1', port);

      await peer.broadcast('auth', { token: getAuthToken() });

      await peer.broadcast('message', { text: message });
      return true;
    } finally {
      peer.cleanup();
    }
  },

  async findPeers() {
    const peer = new Peer({ port: 0 });
    const foundPeers = [];

    try {
      await peer.init();

      const startPort = state.port;
      const endPort = startPort + 10;

      for (let port = startPort; port <= endPort; port++) {
        try {
          await peer.connect('127.0.0.1', port);
          await peer.broadcast('ping', { token: getAuthToken() });
          foundPeers.push(port);
        } catch {}
      }
    } finally {
      peer.cleanup();
    }

    return foundPeers;
  },
};
