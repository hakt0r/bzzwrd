# Unified Display Server API

This module provides a unified, consistent API for interacting with different display servers (X11, Wayland, and potentially Windows in the future). It abstracts away the implementation details of each display server, allowing you to write code that works across different platforms without having to handle each one separately.

## Features

- **Automatic detection** of available display servers
- **Common interface** for X11 and Wayland
- **Mouse control**: absolute and relative movement, clicking, and scrolling
- **Keyboard input**: raw keycode input, key with modifiers, and key release
- **Idle inhibition**: prevent the system from entering screensaver or sleep mode
- **Clipboard operations**: copy text to system clipboard

## Usage

### Basic Usage

The simplest way to use the API is with the `createDisplayServer` factory function, which automatically detects and initializes the appropriate display server implementation:

```javascript
import { createDisplayServer } from './display/index.js';

async function main() {
  // Get the appropriate display server for this system
  const server = await createDisplayServer();
  
  // Create a context
  const ctx = server.contextNew();
  
  // Set up the display with desired dimensions
  const success = server.setup(ctx, 1920, 1080);
  
  // Use the display server
  server.mouseMotion(ctx, 500, 500); // Move mouse to position
  
  // Clean up when done
  server.contextFree(ctx);
}

main().catch(console.error);
```

### Synchronous Initialization

If you need synchronous initialization, you can use the `createDisplayServerSync` function, but note that you'll need to import the specific modules first:

```javascript
import { createDisplayServerSync } from './display/index.js';
// Import the modules directly
import '../x11/_x11.js';
import '../wayland/_wayland.js';

const server = createDisplayServerSync();
// ... use the server as normal
```

### Access to Implementation-Specific Features

If you need to know which implementation is being used or want to use implementation-specific features:

```javascript
import { createDisplayServer, X11DisplayServer, WaylandDisplayServer } from './display/index.js';

async function main() {
  const server = await createDisplayServer();
  
  if (server instanceof X11DisplayServer) {
    console.log('Using X11');
    // X11-specific code
  } else if (server instanceof WaylandDisplayServer) {
    console.log('Using Wayland');
    // Wayland-specific code
  }
}
```

## API Reference

### Factory Functions

- `createDisplayServer()`: Asynchronously creates the appropriate display server instance
- `createDisplayServerSync()`: Synchronously creates the appropriate display server instance

### Classes

- `DisplayServer`: Abstract base class defining the interface
- `X11DisplayServer`: X11 implementation
- `WaylandDisplayServer`: Wayland implementation

### Methods

All display server instances provide these methods:

- **Context Management**
  - `contextNew()`: Create a new context
  - `contextFree(ctx)`: Free a context
  - `setup(ctx, width, height, backend = null)`: Set up the display with given dimensions
  - `close(ctx)`: Close the display connection
  - `prepareFd(ctx)`: Get file descriptor for event handling
  - `displayFlush(ctx)`: Flush display commands

- **Mouse Control**
  - `mouseMotion(ctx, x, y)`: Move mouse to absolute position
  - `mouseRelativeMotion(ctx, dx, dy)`: Move mouse relatively
  - `mouseButton(ctx, button, pressed)`: Press or release a mouse button
  - `mouseWheel(ctx, horizontal, vertical)`: Scroll mouse wheel

- **Keyboard Control**
  - `keyRaw(ctx, keycode, pressed)`: Press or release a key by raw keycode
  - `key(ctx, keycode, modifiers, pressed)`: Press or release a key with modifiers
  - `keyReleaseAll(ctx)`: Release all pressed keys

- **Idle Management**
  - `idleInhibit(ctx, inhibit)`: Enable or disable idle inhibition

- **Clipboard Operations**
  - `haveClipboard()`: Check if clipboard functionality is available
  - `clipboardCopy(isPrimary, data, length)`: Copy data to clipboard

## Examples

See the `examples/display-api-usage.js` file for a complete example of how to use the unified display server API.

## Future Compatibility

The API is designed to be extensible for additional display servers (like Windows) while maintaining a consistent interface. When adding support for a new platform, only a new implementation class needs to be created while the existing code using the API will continue to work without changes. 