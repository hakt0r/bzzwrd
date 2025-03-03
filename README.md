# BZZWRD

A Synergy-like keyboard and mouse sharing solution built with Bun FFI.

## About

BZZWRD is a modern implementation of a keyboard and mouse sharing solution, similar to [Synergy](https://symless.com/synergy). It allows you to seamlessly use a single keyboard and mouse across multiple computers, leveraging Bun's FFI (Foreign Function Interface) capabilities for efficient input device handling.

## Dependencies

### Runtime Dependencies

- [Bun](https://bun.sh) - JavaScript runtime with built-in FFI support
- Linux kernel with uinput support (for virtual input devices)
- X11 development libraries (for screen information)

### System Requirements

The application requires access to the uinput device for creating virtual input devices. You can set this up in one of two ways:

#### Option 1: Automatic Setup (Recommended)

Run the provided setup script with sudo:
```bash
sudo ./scripts/setup-udev.sh
```

This script will:
1. Load the uinput kernel module
2. Create necessary udev rules
3. Add your user to the input group
4. Set correct permissions for /dev/uinput
5. Configure the system to persist these settings after reboot

#### Option 2: Manual Setup

If you prefer to set up manually, you'll need to:

1. Load the uinput kernel module:
```bash
sudo modprobe uinput
```

2. Add your user to the input group:
```bash
sudo usermod -a -G input $USER
```

3. Set correct permissions for /dev/uinput:
```bash
sudo chmod 0660 /dev/uinput
```

After manual setup, you'll need to log out and log back in for the group changes to take effect.

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
