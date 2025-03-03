import { test, expect } from "bun:test";
import { Peer } from "../src/network/peer.js";

test("peer networking", async () => {
  // Create two peers
  const peer1 = new Peer({
    port: 12345,
    token: "test-token"
  });

  const peer2 = new Peer({
    port: 12346,
    token: "test-token"
  });

  // Initialize peers
  await peer1.init();
  await peer2.init();

  // Set up message handlers
  let messageReceived = false;
  const testMessage = { text: "Hello from peer1!" };

  peer2.on("test", (data, info) => {
    expect(data).toEqual(testMessage);
    expect(info.sender).toBe(peer1.id);
    messageReceived = true;
  });

  // Connect peers
  await peer2.connect("127.0.0.1", 12345);
  
  // Wait for connection to establish and authentication to complete
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