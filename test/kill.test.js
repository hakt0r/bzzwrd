import { test, expect } from "bun:test";
import { Peer } from "../src/network/peer.js";

test("kill command terminates peer", async () => {
  // Create a peer to be killed
  const targetPort = 12347;
  const targetPeer = new Peer({ 
    port: targetPort,
    authToken: "test-token" 
  });

  // Create a killer peer
  const killerPeer = new Peer({ 
    port: 0, // random port
    authToken: "test-token"
  });

  // Initialize peers
  await targetPeer.init();
  await killerPeer.init();

  // Verify target peer is running
  expect(targetPeer.socket).toBeDefined();
  
  // Set up promise to detect when target is killed
  const killPromise = new Promise(resolve => {
    targetPeer.on("kill", (data) => {
      if (data.token === "test-token") {
        resolve();
      }
    });
  });
  
  // Send kill command
  await killerPeer.connect("127.0.0.1", targetPort);
  await killerPeer.broadcast("kill", { token: "test-token" });

  // Wait for kill command to be received
  await killPromise;

  // Wait for peer to be killed (max 2 seconds)
  let isKilled = false;
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 200));
    try {
      // Try to create a new peer on the same port
      const testPeer = new Peer({ port: targetPort });
      await testPeer.init();
      testPeer.cleanup();
      isKilled = true;
      break;
    } catch (error) {
      // Port still in use, continue polling
    }
  }

  // Cleanup killer peer
  killerPeer.cleanup();

  // Verify peer was killed
  expect(isKilled).toBe(true);
}, 5000); // Allow up to 5 seconds for test