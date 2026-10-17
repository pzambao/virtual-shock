import { createServer, type IncomingMessage, type Server as HttpServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import {
  parseProtocolMessage,
  serializeMessage,
  type ClientToServerMessage,
} from "@virtual-shock/shared";
import { InputService } from "../input/InputService.js";

export interface HostInfo {
  port: number;
  pairingCode: string;
  addresses: string[];
  clientConnected: boolean;
  clientName?: string;
}

export type HostInfoListener = (info: HostInfo) => void;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".map": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

interface ClientSession {
  id: string;
  ws: WebSocket;
  authenticated: boolean;
  name?: string;
}

export class SessionServer {
  private httpServer: HttpServer | null = null;
  private wss: WebSocketServer | null = null;
  private readonly input: InputService;
  private readonly staticRoot: string;
  private pairingCode: string;
  private port = 0;
  private addresses: string[] = [];
  private readonly clients = new Map<WebSocket, ClientSession>();
  private readonly listeners = new Set<HostInfoListener>();

  constructor(options: {
    input: InputService;
    staticRoot: string;
    pairingCode: string;
  }) {
    this.input = options.input;
    this.staticRoot = options.staticRoot;
    this.pairingCode = options.pairingCode;
  }

  onInfo(listener: HostInfoListener): () => void {
    this.listeners.add(listener);
    listener(this.getInfo());
    return () => this.listeners.delete(listener);
  }

  getInfo(): HostInfo {
    const connected = [...this.clients.values()].find((c) => c.authenticated);
    return {
      port: this.port,
      pairingCode: this.pairingCode,
      addresses: this.addresses,
      clientConnected: Boolean(connected),
      clientName: connected?.name,
    };
  }

  setAddresses(addresses: string[]): void {
    this.addresses = addresses;
    this.emitInfo();
  }

  rotatePairingCode(code: string): void {
    this.pairingCode = code;
    for (const [ws, session] of this.clients) {
      if (session.authenticated) {
        this.dropClient(ws, "pairing_rotated", "Código de pareamento atualizado");
      }
    }
    this.emitInfo();
  }

  async start(port: number): Promise<void> {
    if (this.httpServer) {
      return;
    }

    this.httpServer = createServer((req, res) => {
      this.serveStatic(req, res);
    });

    this.wss = new WebSocketServer({ server: this.httpServer });
    this.wss.on("connection", (ws) => this.handleConnection(ws));

    await new Promise<void>((resolve, reject) => {
      this.httpServer!.once("error", reject);
      this.httpServer!.listen(port, "0.0.0.0", () => {
        this.port = port;
        this.emitInfo();
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    this.input.releaseAll();
    for (const ws of this.clients.keys()) {
      ws.close();
    }
    this.clients.clear();

    await new Promise<void>((resolve) => {
      this.wss?.close(() => resolve());
    });
    await new Promise<void>((resolve, reject) => {
      if (!this.httpServer) {
        resolve();
        return;
      }
      this.httpServer.close((err) => (err ? reject(err) : resolve()));
    });
    this.httpServer = null;
    this.wss = null;
  }

  private emitInfo(): void {
    const info = this.getInfo();
    for (const listener of this.listeners) {
      listener(info);
    }
  }

  private handleConnection(ws: WebSocket): void {
    const session: ClientSession = {
      id: randomUUID(),
      ws,
      authenticated: false,
    };
    this.clients.set(ws, session);
    console.log(`[SessionServer] Client connected (${session.id})`);

    ws.on("message", (data) => {
      const raw = typeof data === "string" ? data : data.toString("utf8");
      const message = parseProtocolMessage(raw);
      if (!message) {
        this.send(ws, {
          type: "error",
          code: "invalid_message",
          message: "Mensagem inválida",
        });
        return;
      }
      this.handleMessage(session, message as ClientToServerMessage);
    });

    ws.on("close", () => {
      this.onClientGone(session);
    });

    ws.on("error", (err) => {
      console.warn(`[SessionServer] Client error: ${err.message}`);
      this.onClientGone(session);
    });
  }

  private handleMessage(session: ClientSession, message: ClientToServerMessage): void {
    switch (message.type) {
      case "hello": {
        if (message.pairingCode !== this.pairingCode) {
          this.send(session.ws, {
            type: "hello_ack",
            ok: false,
            reason: "Código de pareamento inválido",
          });
          this.send(session.ws, {
            type: "session_state",
            status: "rejected",
            message: "Código de pareamento inválido",
          });
          session.ws.close();
          return;
        }

        // Only one authenticated controller at a time for MVP simplicity.
        for (const [otherWs, other] of this.clients) {
          if (other.authenticated && other.id !== session.id) {
            this.dropClient(otherWs, "replaced", "Outro cliente conectou");
          }
        }

        session.authenticated = true;
        session.name = message.clientName ?? "mobile";
        this.send(session.ws, {
          type: "hello_ack",
          ok: true,
          sessionId: session.id,
        });
        this.send(session.ws, {
          type: "session_state",
          status: "connected",
        });
        this.emitInfo();
        console.log(`[SessionServer] Authenticated ${session.name} (${session.id})`);
        return;
      }
      case "ping": {
        this.send(session.ws, { type: "pong", ts: message.ts });
        return;
      }
      case "key_down":
      case "key_up": {
        if (!session.authenticated || message.sessionId !== session.id) {
          this.send(session.ws, {
            type: "error",
            code: "unauthorized",
            message: "Sessão inválida",
          });
          return;
        }
        if (message.type === "key_down") {
          this.input.keyDown(message.key);
        } else {
          this.input.keyUp(message.key);
        }
        return;
      }
      default: {
        this.send(session.ws, {
          type: "error",
          code: "unsupported",
          message: "Tipo de mensagem não suportado",
        });
      }
    }
  }

  private onClientGone(session: ClientSession): void {
    const existed = this.clients.delete(session.ws);
    if (!existed) {
      return;
    }
    if (session.authenticated) {
      this.input.releaseAll();
      console.log(`[SessionServer] Authenticated client disconnected; keys released`);
    }
    this.emitInfo();
  }

  private dropClient(ws: WebSocket, code: string, message: string): void {
    const session = this.clients.get(ws);
    this.send(ws, { type: "error", code, message });
    this.send(ws, {
      type: "session_state",
      status: "disconnected",
      message,
    });
    ws.close();
    if (session) {
      this.onClientGone(session);
    }
  }

  private send(ws: WebSocket, message: Parameters<typeof serializeMessage>[0]): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serializeMessage(message));
    }
  }

  private serveStatic(req: IncomingMessage, res: import("node:http").ServerResponse): void {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }

    const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0] || "/");
    const relative = urlPath === "/" ? "/index.html" : urlPath;
    const resolved = normalize(join(this.staticRoot, relative));

    if (!resolved.startsWith(normalize(this.staticRoot))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    let filePath = resolved;
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      // SPA fallback
      filePath = join(this.staticRoot, "index.html");
    }

    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end("Mobile UI not found. Build apps/mobile and run prepare-mobile.");
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    const body = readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(req.method === "HEAD" ? undefined : body);
  }
}
