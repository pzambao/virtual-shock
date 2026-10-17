/**
 * Smoke test: HTTP + WS pairing + key/stick events (stubs on non-Windows).
 * Run after: pnpm build:shared && pnpm build:desktop && prepare-mobile
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { InputService } from "../dist/main/input/InputService.js";
import { SessionServer } from "../dist/main/ws/session-server.js";
import {
  PROTOCOL_VERSION,
  serializeMessage,
  parseProtocolMessage,
} from "@virtual-shock/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8799;
const CODE = "424242";

const input = new InputService();
input.connectGamepad();

const server = new SessionServer({
  input,
  staticRoot: join(__dirname, "../dist-mobile"),
  pairingCode: CODE,
});

await server.start(PORT);

const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);

function onceMessage(predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("timeout waiting message")),
      timeoutMs,
    );
    const onMessage = (data) => {
      const msg = parseProtocolMessage(String(data));
      if (msg && predicate(msg)) {
        clearTimeout(timer);
        ws.off("message", onMessage);
        resolve(msg);
      }
    };
    ws.on("message", onMessage);
  });
}

try {
  await new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });

  ws.send(
    serializeMessage({
      type: "hello",
      protocolVersion: PROTOCOL_VERSION,
      pairingCode: CODE,
      clientName: "smoke",
    }),
  );

  const ack = await onceMessage((m) => m.type === "hello_ack");
  if (!ack.ok || !ack.sessionId) {
    throw new Error(`hello rejected: ${JSON.stringify(ack)}`);
  }

  const sessionId = ack.sessionId;
  ws.send(serializeMessage({ type: "key_down", key: "KeyA", sessionId }));
  ws.send(serializeMessage({ type: "key_down", key: "KeyW", sessionId }));
  ws.send(
    serializeMessage({
      type: "stick_move",
      sessionId,
      stick: "left",
      x: 0.5,
      y: -0.25,
    }),
  );
  await new Promise((r) => setTimeout(r, 50));
  if (input.getPressed().sort().join(",") !== "KeyA,KeyW") {
    throw new Error(`expected KeyA,KeyW pressed, got ${input.getPressed()}`);
  }

  ws.close();
  await new Promise((r) => setTimeout(r, 100));
  if (input.getPressed().length !== 0) {
    throw new Error(`keys not released after disconnect: ${input.getPressed()}`);
  }

  const html = await fetch(`http://127.0.0.1:${PORT}/`);
  if (!html.ok) {
    throw new Error(`static serve failed: ${html.status}`);
  }

  console.log("smoke-ws OK");
} finally {
  input.dispose();
  await server.stop();
  process.exit(0);
}
