import { app, BrowserWindow, ipcMain } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import QRCode from "qrcode";
import { InputService } from "./input/InputService.js";
import { generatePairingCode, getLanIPv4Addresses } from "./network.js";
import { SessionServer, type HostInfo } from "./ws/session-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PORT = 8787;

let mainWindow: BrowserWindow | null = null;
let sessionServer: SessionServer | null = null;
let latestInfo: HostInfo | null = null;
let qrDataUrl: string | null = null;

function resolveStaticRoot(): string {
  const candidates = [
    join(process.resourcesPath ?? "", "dist-mobile"),
    join(app.getAppPath(), "dist-mobile"),
    join(__dirname, "../../dist-mobile"),
    join(__dirname, "../../../mobile/dist"),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "index.html"))) {
      return candidate;
    }
  }
  // Fall back even if missing — server will return a clear 404.
  return join(__dirname, "../../dist-mobile");
}

function resolvePreload(): string {
  return join(__dirname, "../preload/index.js");
}

function resolveRenderer(): string {
  return join(__dirname, "../renderer/index.html");
}

async function refreshQr(info: HostInfo): Promise<void> {
  const primary = info.addresses[0] ?? "127.0.0.1";
  const url = `http://${primary}:${info.port}/`;
  try {
    qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
  } catch (err) {
    console.warn("[main] QR generation failed", err);
    qrDataUrl = null;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("host:update", { ...info, qrDataUrl });
  }
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    title: "Virtual Shock",
    webPreferences: {
      preload: resolvePreload(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  await mainWindow.loadFile(resolveRenderer());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function startHost(): Promise<void> {
  const input = new InputService();
  const pairingCode = generatePairingCode();
  const staticRoot = resolveStaticRoot();
  console.log(`[main] Serving mobile UI from ${staticRoot}`);

  sessionServer = new SessionServer({
    input,
    staticRoot,
    pairingCode,
  });

  sessionServer.setAddresses(getLanIPv4Addresses());
  sessionServer.onInfo((info) => {
    latestInfo = info;
    void refreshQr(info);
  });

  await sessionServer.start(DEFAULT_PORT);
  console.log(
    `[main] Host listening on port ${DEFAULT_PORT}, code ${pairingCode}`,
  );
}

function registerIpc(): void {
  ipcMain.handle("host:getInfo", async () => {
    return {
      ...(latestInfo ?? {
        port: DEFAULT_PORT,
        pairingCode: "------",
        addresses: [],
        clientConnected: false,
      }),
      qrDataUrl,
    };
  });

  ipcMain.handle("host:rotateCode", async () => {
    if (!sessionServer) {
      return null;
    }
    const code = generatePairingCode();
    sessionServer.rotatePairingCode(code);
    return sessionServer.getInfo();
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    registerIpc();
    await startHost();
    await createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    void sessionServer?.stop();
  });
}
