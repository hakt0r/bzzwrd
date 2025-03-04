import os from 'node:os';
import path from 'node:path';
import { icon } from '../src/colors.js';

/*
  ██╗    ██╗ █████╗ ██╗   ██╗██╗      █████╗ ███╗   ██╗██████╗
  ██║    ██║██╔══██╗╚██╗ ██╔╝██║     ██╔══██╗████╗  ██║██╔══██╗
  ██║ █╗ ██║███████║ ╚████╔╝ ██║     ███████║██╔██╗ ██║██║  ██║
  ██║███╗██║██╔══██║  ╚██╔╝  ██║     ██╔══██║██║╚██╗██║██║  ██║
  ╚███╔███╔╝██║  ██║   ██║   ███████╗██║  ██║██║ ╚████║██████╔╝
   ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝
*/

class VirtualScreen {
  display = null;
  
  static which(app) {
    const result = Bun.spawnSync(['which', app]);
    return result.exitCode === 0;
  }

  constructor(app) {
    this.app = app;
    this.path = VirtualScreen.which(app) ? app : null;
    if (!this.path) throw new Error(`${app} not found`);
    this.deferReady = new Promise((resolve) => (this.ready = resolve));
  }

  async start() {
    console.debug(`${icon('🪟')} [${this.app.yellow}] starting...`);
    await this._start();
    await this.deferReady;
    console.debug(`${icon('🪟')} [${this.app.yellow}] started with pid ${this.process.pid} at ${this.display}`);
  }

  stop = () => this.process.kill();

  spawn = async (args, opts) => {
    opts.stdio = ['pipe', 'pipe', 'pipe'];
    opts.onExit = (code, signal) => {
      console.debug`${icon('🪟')} [${this.app.yellow}] exited with code ${code} and signal ${signal}`;
      this.onExit?.(code, signal);
    };
    this.process = await Bun.spawn(args, opts);
    this.process.stdout.pipeTo(this.processOutput('stdout'));
    this.process.stderr.pipeTo(this.processOutput('stderr'));
  };

  processOutput = (source) =>
    new WritableStream({
      write: (data) => {
        data = Buffer.from(data).toString('utf-8').trim().split('\n');
        for (const line of data) {
          const match = line.match(/^(\w+)=([-\w\d]+)$/);
          if (match) this.onVar?.(match[1], match[2]);
          else if (this.onOutput) this.onOutput(line);
          else if (source === 'stderr') this.onError(line);
          else console.debug(`${icon('🪟')} [${this.app.yellow}] ${line}`);
        }
      },
      close: () => console.debug(`${icon('🪟')} [${this.app.yellow}] stream closed`),
    });

  onError = (data) => console.debug(`${icon('🪟')} [${this.app.red}] ${Buffer.from(data).toString('utf-8').trim()}`);
}

/*
  ███████╗██╗    ██╗ █████╗ ██╗   ██╗
  ██╔════╝██║    ██║██╔══██╗╚██╗ ██╔╝
  ███████╗██║ █╗ ██║███████║ ╚████╔╝
  ╚════██║██║███╗██║██╔══██║  ╚██╔╝
  ███████║╚███╔███╔╝██║  ██║   ██║
  ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝
*/

export class Sway extends VirtualScreen {
  constructor() {
    super('sway');
    this.configPath = path.join(os.tmpdir(), 'sway-config');
    this.config = `
      exec "echo WAYLAND_DISPLAY=$WAYLAND_DISPLAY"
      exec "echo HEADLESS-READY"
    `;
    console.debug(`${icon('🪟')} [${this.app.yellow}] config: ${this.configPath}`);
  }

  async _start() {
    await Bun.write(this.configPath, this.config);
    await this.spawn([this.path, '-d', '-c', this.configPath], {
      env: {
        ...process.env,
        XDG_SESSION_TYPE: 'wayland',
        WLR_BACKENDS: 'headless',
        WLR_RENDERER_ALLOW_SOFTWARE: '1',
        WLR_LIBINPUT_NO_DEVICES: '1',
        WLR_NO_HARDWARE_CURSORS: '1',
        WAYLAND_DISPLAY: undefined,
      },
    });
  }

  onExit = () => Bun.file(this.configPath).delete();
  onOutput = (data) => data === 'HEADLESS-READY' && this.ready();
  onVar = (key, value) => key === 'WAYLAND_DISPLAY' && (this.display = value);
}

/*
  ██╗  ██╗██████╗ ███████╗
  ██║ ██╔╝██╔══██╗██╔════╝
  █████╔╝ ██║  ██║█████╗
  ██╔═██╗ ██║  ██║██╔══╝
  ██║  ██╗██████╔╝███████╗
  ╚═╝  ╚═╝╚═════╝ ╚══════╝
*/

export class KDE extends VirtualScreen {
  constructor() {
    super('kwin_wayland');
  }
  _start = async () => await this.spawn([this.path, '--virtual', '--no-lockscreen'], {});
  onOutput = (data) => {
    const match = data.match(/Accepting client connections on sockets: QList\("([^"]+)"\)/);
    if (match) {
      this.display = match[1];
      console.debug(`${icon('🪟')} [${this.app.yellow}] display: ${this.display}`);
      this.ready();
    }
  }
}

/*
 ██████╗ ███╗   ██╗ ██████╗ ███╗   ███╗███████╗
██╔════╝ ████╗  ██║██╔═══██╗████╗ ████║██╔════╝
██║  ███╗██╔██╗ ██║██║   ██║██╔████╔██║█████╗
██║   ██║██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══╝
╚██████╔╝██║ ╚████║╚██████╔╝██║ ╚═╝ ██║███████╗
 ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
*/

export class Gnome extends VirtualScreen {
  constructor() {
    super('gnome-shell');
  }
  _start = async () => await this.spawn([this.path, '--headless', '--wayland', '--mode=user', '--replace'], {});
  onOutput = (data) => {
    if (!data.includes('Using Wayland display name')) return console.debug(`${icon('🪟')} [${this.app.yellow}] ${data}`);
    this.display = data.match(/Using Wayland display name '([^']+)'/)?.[1];
    if (!this.display) return console.debug(`${icon('🪟')} [${this.app.yellow}] ${data}`);
    this.ready();
  }
}

/*
██╗  ██╗██╗   ██╗███████╗██████╗
╚██╗██╔╝██║   ██║██╔════╝██╔══██╗
 ╚███╔╝ ██║   ██║█████╗  ██████╔╝
 ██╔██╗ ╚██╗ ██╔╝██╔══╝  ██╔══██╗
██╔╝ ██╗ ╚████╔╝ ██║     ██████╔╝
╚═╝  ╚═╝  ╚═══╝  ╚═╝     ╚═════╝
*/

export class X11 extends VirtualScreen {
  constructor() {
    super('Xvfb');
  }
  _start = async () => await this.spawn([this.path, '-screen', '.0', '1920x1080x24', '-displayfd', '2', '-auth', '/dev/null'], {});
  onOutput = (data) => {
    const match = data.match(/^\d+$/);
    if (!match) return console.debug(`${icon('🪟')} [${this.app.yellow}] ${data}`);
    this.display = `:${match[0]}`;
    this.ready();
  }
}
