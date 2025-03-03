# BZZWRD

A Synergy-like keyboard and mouse sharing solution built with Bun FFI. Based on the [waynergy](https://github.com/r-c-f/waynergy) project with unified X11 and Wayland support.

## About

BZZWRD is a modern implementation of a keyboard and mouse sharing solution, similar to [Synergy](https://symless.com/synergy). It allows you to seamlessly use a single keyboard and mouse across multiple computers, leveraging Bun's FFI (Foreign Function Interface) capabilities for efficient input device handling.

## Dependencies

### Runtime Dependencies

- [Bun](https://bun.sh) - JavaScript runtime with built-in FFI support
- Linux kernel with uinput support (for virtual input devices)
- X11 development libraries (for screen information)

### System Requirements

The application requires access to the uinput device for creating virtual input devices. You can set this up in one of two ways:

## Features (Planned)

- Share mouse and keyboard between multiple computers
- Seamless cursor transition between screens
- Clipboard sharing
- SSL encryption for secure communication
- Cross-platform support

## Installation

```bash
bun install
```

## Development

```bash
bun run dev
```

## Testing

```bash
bun test
```

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Author

Sebastian Glaser ([@hakt0r](https://github.com/hakt0r))  
Contact: anx@hktr.de
