/**
 * Main entry point for the unified display server API.
 * 
 * This module provides a unified interface for interacting with various
 * display servers (X11, Wayland, and potentially Windows in the future).
 * 
 * @module display
 */

export { DisplayServer, X11DisplayServer, WaylandDisplayServer, createDisplayServer, createDisplayServerSync } from '../display.js';

/**
 * Convenience re-export of the createDisplayServer function.
 * This is the recommended way to get a display server instance.
 */
export { createDisplayServer as default } from '../display.js'; 