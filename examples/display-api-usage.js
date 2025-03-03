/**
 * Display Server API Usage Example
 * 
 * This file demonstrates how to use the unified display server API
 * to control input devices (mouse, keyboard) and manage clipboard.
 */

import { createDisplayServer } from '../src/display/index.js';

async function main() {
  try {
    // Get the appropriate display server for this system
    // This will automatically detect Wayland or X11
    const server = await createDisplayServer();
    console.log(`Using display server: ${server.constructor.name}`);
    
    // Create a context
    const ctx = server.contextNew();
    console.log('Created display server context');
    
    // Set up the display
    const success = server.setup(ctx, 1920, 1080);
    if (!success) {
      console.error('Failed to set up display server');
      return;
    }
    console.log('Display server setup complete');
    
    // Prepare file descriptor for event handling
    const fd = server.prepareFd(ctx);
    console.log(`Display server file descriptor: ${fd}`);
    
    // Check clipboard availability
    const hasClipboard = server.haveClipboard();
    console.log(`Clipboard available: ${hasClipboard}`);
    
    // Example: Mouse control
    console.log('\n--- Mouse Control Examples ---');
    
    // Move mouse to absolute position
    console.log('Moving mouse to position (500, 500)');
    server.mouseMotion(ctx, 500, 500);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Move mouse relatively
    console.log('Moving mouse relatively by (100, 100)');
    server.mouseRelativeMotion(ctx, 100, 100);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click left mouse button
    console.log('Clicking left mouse button');
    server.mouseButton(ctx, 1, 1); // Press
    await new Promise(resolve => setTimeout(resolve, 100));
    server.mouseButton(ctx, 1, 0); // Release
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scroll mouse wheel
    console.log('Scrolling mouse wheel down');
    server.mouseWheel(ctx, 0, -120);
    
    // Example: Keyboard control
    console.log('\n--- Keyboard Control Examples ---');
    
    // Type a key (raw)
    console.log('Typing "a" key using raw method');
    server.keyRaw(ctx, 30, 1); // Press 'a'
    await new Promise(resolve => setTimeout(resolve, 100));
    server.keyRaw(ctx, 30, 0); // Release 'a'
    
    // Type a key with modifiers
    console.log('Typing "A" key (shift+a) using modifiers');
    server.key(ctx, 30, 1, 1); // Press 'A' (shift+a)
    await new Promise(resolve => setTimeout(resolve, 100));
    server.key(ctx, 30, 1, 0); // Release 'A'
    
    // Make sure all keys are released
    console.log('Releasing all keys');
    server.keyReleaseAll(ctx);
    
    // Example: Idle inhibition
    console.log('\n--- Idle Inhibition Example ---');
    
    // Enable idle inhibition (prevent screensaver/sleep)
    console.log('Enabling idle inhibition');
    server.idleInhibit(ctx, true);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Disable idle inhibition
    console.log('Disabling idle inhibition');
    server.idleInhibit(ctx, false);
    
    // Example: Clipboard 
    if (hasClipboard) {
      console.log('\n--- Clipboard Example ---');
      
      // Copy text to clipboard
      const text = 'Hello from waynergy unified API!';
      const data = new TextEncoder().encode(text);
      console.log(`Copying text to clipboard: "${text}"`);
      server.clipboardCopy(0, data, data.length);
      
      console.log('Try pasting in another application to see the result');
    }
    
    // Display flush (to ensure all commands are sent)
    server.displayFlush(ctx);
    
    // Clean up
    console.log('\n--- Cleanup ---');
    console.log('Closing display server context');
    server.close(ctx);
    server.contextFree(ctx);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 