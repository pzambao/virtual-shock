import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseProtocolMessage,
  PROTOCOL_VERSION,
  serializeMessage,
  type HelloMessage,
  type KeyDownMessage,
} from "./protocol.js";

describe("parseProtocolMessage", () => {
  it("parses a valid hello message", () => {
    const raw = serializeMessage({
      type: "hello",
      protocolVersion: PROTOCOL_VERSION,
      pairingCode: "123456",
      clientName: "phone",
    } satisfies HelloMessage);

    const msg = parseProtocolMessage(raw);
    assert.ok(msg);
    assert.equal(msg.type, "hello");
    if (msg.type === "hello") {
      assert.equal(msg.pairingCode, "123456");
      assert.equal(msg.clientName, "phone");
    }
  });

  it("rejects hello with wrong protocol version", () => {
    const raw = JSON.stringify({
      type: "hello",
      protocolVersion: 999,
      pairingCode: "123456",
    });
    assert.equal(parseProtocolMessage(raw), null);
  });

  it("parses key_down only for allowed keys", () => {
    const ok: KeyDownMessage = {
      type: "key_down",
      key: "KeyW",
      sessionId: "s1",
    };
    assert.deepEqual(parseProtocolMessage(serializeMessage(ok)), ok);

    const bad = JSON.stringify({
      type: "key_down",
      key: "KeyZ",
      sessionId: "s1",
    });
    assert.equal(parseProtocolMessage(bad), null);
  });

  it("rejects invalid JSON and unknown types", () => {
    assert.equal(parseProtocolMessage("not-json"), null);
    assert.equal(parseProtocolMessage(JSON.stringify({ type: "nope" })), null);
  });

  it("parses ping/pong", () => {
    const ping = parseProtocolMessage(
      serializeMessage({ type: "ping", ts: 42 }),
    );
    assert.deepEqual(ping, { type: "ping", ts: 42 });
  });

  it("parses stick_move for left and right", () => {
    const left = parseProtocolMessage(
      serializeMessage({
        type: "stick_move",
        sessionId: "s1",
        stick: "left",
        x: 0.5,
        y: -0.25,
      }),
    );
    assert.deepEqual(left, {
      type: "stick_move",
      sessionId: "s1",
      stick: "left",
      x: 0.5,
      y: -0.25,
    });

    const right = parseProtocolMessage(
      serializeMessage({
        type: "stick_move",
        sessionId: "s1",
        stick: "right",
        x: -1,
        y: 1,
      }),
    );
    assert.equal(right && right.type === "stick_move" && right.stick, "right");
  });

  it("parses pad_down / pad_up", () => {
    const down = parseProtocolMessage(
      serializeMessage({ type: "pad_down", sessionId: "s1", button: "A" }),
    );
    assert.deepEqual(down, {
      type: "pad_down",
      sessionId: "s1",
      button: "A",
    });
    assert.equal(
      parseProtocolMessage(
        JSON.stringify({ type: "pad_down", sessionId: "s1", button: "Z" }),
      ),
      null,
    );
    const l3 = parseProtocolMessage(
      serializeMessage({ type: "pad_down", sessionId: "s1", button: "L3" }),
    );
    assert.deepEqual(l3, {
      type: "pad_down",
      sessionId: "s1",
      button: "L3",
    });
  });
});

