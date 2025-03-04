# BZZWRD

A Synergy-like keyboard and mouse sharing solution built with Bun FFI. Based on the [waynergy](https://github.com/r-c-f/waynergy) project with unified X11 and Wayland support.

## About

BZZWRD is a modern implementation of a keyboard and mouse sharing solution, similar to [Synergy](https://symless.com/synergy). It allows you to seamlessly use a single keyboard and mouse across multiple computers, leveraging Bun's FFI (Foreign Function Interface) capabilities for efficient input device handling.

## Dependencies

### Runtime Dependencies

- [Bun](https://bun.sh) - JavaScript runtime with built-in FFI support
- Linux kernel with uinput support (for virtual input devices)
- X11 development libraries (for X11 display server support)
  - libx11-dev
  - libXfixes
  - libXtst
  - libXext
  - xclip
- Wayland libraries (for Wayland display server support)
  - libwayland-dev
  - libxkbcommon-dev
  - libinput-dev
  - libwlroots-dev (version 0.18)
  - wl-clipboard (for clipboard support)

### System Requirements

The application requires access to the uinput device for creating virtual input devices. You'll need:

- Linux kernel with uinput module loaded
- Proper permissions to access the uinput device

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bzzwrd.git
cd bzzwrd

# Install dependencies
bun install

# The application will check for and help install system dependencies
bun run deps
```

## Usage

BZZWRD provides a command-line interface with several commands:

```bash
# Show help and available commands
bun run bzz help

# Start a server (host)
bun run bzz spawn [port]

# Connect to a server
bun run bzz connect <host>

# Check dependencies
bun run bzz deps

# Send commands to a running instance
bun run bzz send <command>

# Kill a running instance
bun run bzz kill

# Set up another machine to connect to this one
bun run bzz infect
```

### Server Mode

To share your keyboard and mouse with other computers:

```bash
bun run bzz spawn
```

This will start a server on the default port. You can specify a custom port:

```bash
bun run bzz spawn 24800
```

### Client Mode

To connect to a computer sharing its keyboard and mouse:

```bash
bun run bzz connect 192.168.1.100
```

Replace `192.168.1.100` with the IP address of the server.

## Development

```bash
# Run in development mode with debug output
DEBUG=1 bun run dev
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
