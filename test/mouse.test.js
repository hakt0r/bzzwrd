import { test, expect } from "bun:test";
import { VirtualMouse } from "../src/input/virtual.js";
import { X11Display } from "../src/x11/display.js";

test("virtual mouse operations", async () => {
  const display = new X11Display();
  const mouse = new VirtualMouse();

  try {
    // Get screen dimensions
    const screens = display.getScreens();
    const mainScreen = screens[0];
    expect(mainScreen.width).toBeGreaterThan(0);
    expect(mainScreen.height).toBeGreaterThan(0);

    // Initialize mouse
    await mouse.init();

    // Test 1: Single click
    const clickResult = await mouse.click('left');
    expect(clickResult).toBe(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Move in a square pattern
    const moves = [
      { dx: 100, dy: 0 },    // Right
      { dx: 0, dy: 100 },    // Down
      { dx: -100, dy: 0 },   // Left
      { dx: 0, dy: -100 }    // Up
    ];

    for (const move of moves) {
      const moveResult = await mouse.moveRelative(move.dx, move.dy);
      expect(moveResult).toBe(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test 3: Drag operation
    const dragResult = await mouse.dragTo(200, 200);
    expect(dragResult).toBe(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Different buttons
    for (const button of ['left', 'middle', 'right']) {
      const buttonResult = await mouse.click(button);
      expect(buttonResult).toBe(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } finally {
    await mouse.cleanup();
    display.cleanup();
  }
}); 