if (!process.env.DEBUG) console.debug = () => {};

export const red = Bun.color('red', 'ansi');
export const green = Bun.color('green', 'ansi');
export const yellow = Bun.color('yellow', 'ansi');
export const blue = Bun.color('blue', 'ansi');
export const magenta = Bun.color('magenta', 'ansi');
export const cyan = Bun.color('cyan', 'ansi');
export const gray = Bun.color('gray', 'ansi');
export const reset = '\x1b[0m';

for (const color of ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'gray']) {
  Object.defineProperty(String.prototype, color, {
    get() { return `${Bun.color(color, 'ansi')}${this}${reset}` },
    configurable: true,
    enumerable: false,
  });
}

const saveCursor = '\x1b7';
const restoreCursor = '\x1b8';
const moveRight = '\x1b[2C';

export function icon(emoji, color = '') {
  return `${saveCursor}${color}${emoji}${reset}${restoreCursor}${moveRight}`;
}

export const success = icon('✅', green);
export const error = icon('✗', red);
export const warning = icon('⚠', yellow);
export const info = icon('ℹ', cyan);

export const rocket = icon('🚀', cyan);
export const pkg = icon('📦', cyan);
export const plug = icon('🔌', cyan);
export const sparkles = icon('✨', green);
export const clipboard = icon('📋', cyan);
export const key = icon('🔑', cyan);
export const upload = icon('📤', cyan);
export const mouse = icon('🖱️', cyan);
export const bug = icon('🐛', cyan);
export const network = icon('📡', cyan);
export const ping = icon('🏓', gray);
export const skull = icon('💀', red);
export const timer = icon('⏱️', yellow);
export const message = icon('📨', cyan);
export const handshake = icon('🤝', cyan);
export const wave = icon('👋', yellow);
export const token = icon('🎟️', cyan); 