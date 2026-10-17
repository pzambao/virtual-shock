import { isAllowedKey, type AllowedKey } from "./keys.js";

export const PROTOCOL_VERSION = 1 as const;

export type SessionStatus =
  | "connected"
  | "rejected"
  | "disconnected"
  | "error";

export interface HelloMessage {
  type: "hello";
  protocolVersion: typeof PROTOCOL_VERSION;
  pairingCode: string;
  clientName?: string;
}

export interface HelloAckMessage {
  type: "hello_ack";
  ok: boolean;
  sessionId?: string;
  reason?: string;
}

export interface KeyDownMessage {
  type: "key_down";
  key: AllowedKey;
  sessionId: string;
}

export interface KeyUpMessage {
  type: "key_up";
  key: AllowedKey;
  sessionId: string;
}

export interface SessionStateMessage {
  type: "session_state";
  status: SessionStatus;
  message?: string;
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

export interface PingMessage {
  type: "ping";
  ts: number;
}

export interface PongMessage {
  type: "pong";
  ts: number;
}

export type ClientToServerMessage =
  | HelloMessage
  | KeyDownMessage
  | KeyUpMessage
  | PingMessage;

export type ServerToClientMessage =
  | HelloAckMessage
  | SessionStateMessage
  | ErrorMessage
  | PongMessage;

export type ProtocolMessage = ClientToServerMessage | ServerToClientMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseProtocolMessage(raw: string): ProtocolMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string") {
    return null;
  }

  switch (parsed.type) {
    case "hello": {
      if (
        parsed.protocolVersion !== PROTOCOL_VERSION ||
        typeof parsed.pairingCode !== "string"
      ) {
        return null;
      }
      const msg: HelloMessage = {
        type: "hello",
        protocolVersion: PROTOCOL_VERSION,
        pairingCode: parsed.pairingCode,
      };
      if (typeof parsed.clientName === "string") {
        msg.clientName = parsed.clientName;
      }
      return msg;
    }
    case "hello_ack": {
      if (typeof parsed.ok !== "boolean") {
        return null;
      }
      const msg: HelloAckMessage = { type: "hello_ack", ok: parsed.ok };
      if (typeof parsed.sessionId === "string") {
        msg.sessionId = parsed.sessionId;
      }
      if (typeof parsed.reason === "string") {
        msg.reason = parsed.reason;
      }
      return msg;
    }
    case "key_down":
    case "key_up": {
      if (
        typeof parsed.key !== "string" ||
        !isAllowedKey(parsed.key) ||
        typeof parsed.sessionId !== "string"
      ) {
        return null;
      }
      return {
        type: parsed.type,
        key: parsed.key,
        sessionId: parsed.sessionId,
      };
    }
    case "session_state": {
      if (
        typeof parsed.status !== "string" ||
        !["connected", "rejected", "disconnected", "error"].includes(
          parsed.status,
        )
      ) {
        return null;
      }
      const msg: SessionStateMessage = {
        type: "session_state",
        status: parsed.status as SessionStatus,
      };
      if (typeof parsed.message === "string") {
        msg.message = parsed.message;
      }
      return msg;
    }
    case "error": {
      if (typeof parsed.code !== "string" || typeof parsed.message !== "string") {
        return null;
      }
      return {
        type: "error",
        code: parsed.code,
        message: parsed.message,
      };
    }
    case "ping":
    case "pong": {
      if (typeof parsed.ts !== "number") {
        return null;
      }
      return { type: parsed.type, ts: parsed.ts };
    }
    default:
      return null;
  }
}

export function serializeMessage(message: ProtocolMessage): string {
  return JSON.stringify(message);
}
