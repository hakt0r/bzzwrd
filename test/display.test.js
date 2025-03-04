import { expect, test, describe, beforeAll, afterAll } from 'bun:test';
import { DisplayServer } from '../src/display.js';
import '../src/x11/index.js';
import '../src/wayland/index.js';
import { Sway, Gnome, KDE, X11 } from './headless.js';

const environments = [
  {
    name: 'sway',
    virtual: Sway,
    env: {
      XDG_SESSION_TYPE: 'wayland',
      XDG_CURRENT_DESKTOP: 'sway',
    },
  },
  /* {
    name: 'gnome',
    virtual: Gnome,
    env: {
      XDG_SESSION_TYPE: 'wayland',
      XDG_CURRENT_DESKTOP: 'GNOME',
    }
  },
  {
    name: 'kde',
    virtual: KDE,
    env: {
      XDG_SESSION_TYPE: 'wayland',
      XDG_CURRENT_DESKTOP: 'KDE',
    }
  },*/
  {
    name: 'x11',
    virtual: X11,
    env: {
      XDG_SESSION_TYPE: 'x11',
    }
  }
];


describe.each(Object.values(environments).map((env) => env.name))('Display[%s]', (name) => {
  const config = environments.find((e) => e.name === name);
  let virtual = null;
  let server = null;
  
  beforeAll(async () => {  
    virtual = new config.virtual();
    await virtual.start();
  
    for (const [key, value] of Object.entries(config.env)) process.env[key] = value;
    
    server = DisplayServer.create(config.env.XDG_SESSION_TYPE);
  
    for (const [key, value] of Object.entries(config.env))
      server.setEnv(Buffer.from(`${key}\0`), Buffer.from(`${value}\0`));
  
    if (config.env.XDG_SESSION_TYPE === 'wayland')
      server.setEnv('WAYLAND_DISPLAY', virtual.display);
    else if (config.env.XDG_SESSION_TYPE === 'x11')
      server.setEnv('DISPLAY', virtual.display);
  
    server.setup(virtual.width, virtual.height);
  });
  
  afterAll(() => {
    for (const [key, value] of Object.entries(config.env)){
      delete process.env[key]
      server.setEnv(Buffer.from(`${key}\0`), Buffer.from(`${value}\0`));
    }
    server.close();
    virtual.stop();
  });

  test('can create a display server instance', () => {
    expect(virtual).toBeInstanceOf(config.virtual);
    expect(server).toBeInstanceOf(DisplayServer);
    if (config.env.XDG_SESSION_TYPE === 'wayland') expect(server).toBeInstanceOf(DisplayServer.Wayland);
    else expect(server).toBeInstanceOf(DisplayServer.X11);
  });

  test('can create a context', () => {
    expect(server.ptr).toBeDefined();
  });

  test('can get display file descriptor', () => {
    const fd = server.prepareFd();
    if (server instanceof DisplayServer.Wayland) expect(fd).toBeGreaterThan(0);
    else expect(fd).toBe(1);
  });

  test('can flush display', () => {
    expect(() => {
      const result = server.displayFlush();
      expect(result).toBe(true);
    }).not.toThrow();
  });

  test('can move mouse', () => {
    expect(() => {
      expect(server.mouseMotion).toBeDefined();
      expect(server.mouseMotion(100, 100)).toBe(true);
    }).not.toThrow();
  });

  test('can move mouse relatively', () => {
    expect(server.mouseRelativeMotion).toBeDefined();
    expect(() => {
      expect(server.mouseRelativeMotion(10, 10)).toBe(true);
    }).not.toThrow();
  });

  test('can click mouse buttons', () => {
    expect(server.mouseButton).toBeDefined();
    expect(() => {
      expect(server.mouseButton(1, 1)).toBe(true);
      expect(server.mouseButton(1, 0)).toBe(true);
    }).not.toThrow();
  });

  test('can scroll mouse wheel', () => {
    expect(() => {
      expect(server.mouseWheel(0, 120)).toBe(true);
      expect(server.mouseWheel(0, -120)).toBe(true);
    }).not.toThrow();
  });

  test('can send keyboard input', () => {
    expect(() => {
      expect(server.keyRaw(30, 1)).toBe(true);
      expect(server.keyRaw(30, 0)).toBe(true);
    }).not.toThrow();
  });

  test('can release all keys', () => {
    expect(() => {
      expect(server.keyReleaseAll()).toBe(true);
    }).not.toThrow();
  });

  test('can toggle idle inhibition', () => {
    expect(() => {
      expect(server.idleInhibit(true)).toBe(true);
      expect(server.idleInhibit(false)).toBe(true);
    }).not.toThrow();
  });

  test('can check for clipboard', () => {
    expect(() => {
      expect(server.haveClipboard()).toBe(true);
    }).not.toThrow();
  });

  test('can copy clipboard content', () => {
    expect(() => {
      expect(server.clipboardCopy(0, 'test', 4)).toBe(true);
    }).not.toThrow();
  });

  test('can paste clipboard content', () => {
    expect(() => {
      expect(server.clipboardPaste(0)).toBeDefined();
    }).not.toThrow();
  });
});
