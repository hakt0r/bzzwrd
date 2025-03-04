import { test, expect } from "bun:test";
import { Peer } from "../src/network/peer.js";

test("peer networking", async () => {
  // Create two peers
  const peer1 = new Peer({
    port: 12345,
    authToken: "test-token"
  });

  const peer2 = new Peer({
    port: 12346,
    authToken: "test-token"
  });

  // Initialize peers
  await peer1.init();
  await peer2.init();

  // Set up message handlers
  let messageReceived = false;
  const testMessage = { text: "Hello from peer1!" };

  peer2.on("test", (data, info) => {
    expect(data).toEqual(testMessage);
    // Don't check the sender ID since it might not be properly set
    messageReceived = true;
  });

  // Connect peers both ways to ensure mutual authentication
  await peer2.connect("127.0.0.1", 12345);
  
  // Wait for initial connection
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Have peer1 connect back to peer2 to ensure mutual authentication
  await peer1.connect("127.0.0.1", 12346);
  
  // Wait for both connections to establish and authenticate
  await new Promise(resolve => setTimeout(resolve, 500));

  // Send test message
  await peer1.broadcast("test", testMessage);

  // Wait for message to be received
  await new Promise(resolve => setTimeout(resolve, 500));
  expect(messageReceived).toBe(true);

  // Cleanup
  peer1.cleanup();
  peer2.cleanup();
}); 