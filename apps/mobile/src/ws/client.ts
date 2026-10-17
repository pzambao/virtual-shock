import {
  parseProtocolMessage,
  serializeMessage,
  PROTOCOL_VERSION,
  type ClientToServerMessage,
  type ServerToClientMessage,
  type AllowedKey,
} from "@virtual-shock/shared";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "rejected"
  | "disconnected"
  | "error";

export interface SessionClientOptions {
  onStatus: (status: ConnectionStatus, detail?: string) => void;
  onMessage?: (message: ServerToClientMessage) => void;
}

export class SessionClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private readonly options: SessionClientOptions;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: SessionClientOptions) {
    this.options = options;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  connect(wsUrl: string, pairingCode: string): void {
    this.disconnect(false);
    this.options.onStatus("connecting");

    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.send({
        type: "hello",
        protocolVersion: PROTOCOL_VERSION,
        pairingCode,
        clientName: "mobile",
      });
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") {
        return;
      }
      const message = parseProtocolMessage(event.data);
      if (!message) {
        return;
      }

      if (message.type === "hello_ack") {
        if (message.ok && message.sessionId) {
          this.sessionId = message.sessionId;
          this.options.onStatus("connected");
          this.startPing();
        } else {
          this.sessionId = null;
          this.options.onStatus("rejected", message.reason ?? "rejected");
          ws.close();
        }
      } else if (message.type === "pong") {
        // heartbeat ok
      } else if (message.type === "session_state") {
        this.options.onStatus(
          message.status === "connected" ? "connected" : message.status,
          message.message,
        );
      } else if (message.type === "error") {
        this.options.onStatus("error", message.message);
      }

      this.options.onMessage?.(message as ServerToClientMessage);
    };

    ws.onerror = () => {
      this.options.onStatus("error", "WebSocket error");
    };

    ws.onclose = () => {
      this.stopPing();
      this.sessionId = null;
      this.ws = null;
      this.options.onStatus("disconnected");
    };
  }

  disconnect(notify = true): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    if (notify) {
      this.options.onStatus("disconnected");
    }
  }

  keyDown(key: AllowedKey): void {
    if (!this.sessionId) {
      return;
    }
    this.send({ type: "key_down", key, sessionId: this.sessionId });
  }

  keyUp(key: AllowedKey): void {
    if (!this.sessionId) {
      return;
    }
    this.send({ type: "key_up", key, sessionId: this.sessionId });
  }

  private send(message: ClientToServerMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(serializeMessage(message));
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: "ping", ts: Date.now() });
    }, 5000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

export function buildWsUrl(host: string): string {
  const trimmed = host.trim().replace(/\/$/, "");
  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return trimmed;
  }
  if (trimmed.startsWith("http://")) {
    return `ws://${trimmed.slice("http://".length)}`;
  }
  if (trimmed.startsWith("https://")) {
    return `wss://${trimmed.slice("https://".length)}`;
  }
  return `ws://${trimmed}`;
}

export function defaultHostFromLocation(): string {
  if (typeof window === "undefined") {
    return "127.0.0.1:8787";
  }
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("host");
  if (fromQuery) {
    return fromQuery;
  }
  // Vite dev server is not the WebSocket host — Electron listens on 8787.
  if (window.location.port === "5173") {
    return `${window.location.hostname}:8787`;
  }
  // When served by Electron HTTP, same host/port works for WS.
  if (window.location.port) {
    return window.location.host;
  }
  return `${window.location.hostname}:8787`;
}
