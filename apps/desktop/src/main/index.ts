import { app, BrowserWindow, ipcMain } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import QRCode from "qrcode";
import { InputService } from "./input/InputService.js";
import { generatePairingCode, getLanIPv4Addresses } from "./network.js";
import {
  installVigemBusElevated,
  resolveVigemSetupPath,
} from "./vigem/install.js";
import { SessionServer, type HostInfo } from "./ws/session-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PORT = 8787;

let mainWindow: BrowserWindow | null = null;
let sessionServer: SessionServer | null = null;
let inputService: InputService | null = null;
let latestInfo: HostInfo | null = null;
let qrDataUrl: string | null = null;
let gamepadDetail: string | undefined;

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
  return join(__dirname, "../../dist-mobile");
}

function resolvePreload(): string {
  return join(__dirname, "../preload/index.js");
}

function resolveRenderer(): string {
  return join(__dirname, "../renderer/index.html");
}

function pushHostUpdate(): void {
  if (!sessionServer) {
    return;
  }
  latestInfo = sessionServer.getInfo();
  void refreshQr(latestInfo);
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
    mainWindow.webContents.send("host:update", {
      ...info,
      qrDataUrl,
      gamepadDetail,
    });
  }
}

async function ensureGamepad(input: InputService): Promise<void> {
  if (process.platform !== "win32") {
    input.connectGamepad();
    gamepadDetail = "Stub (fora do Windows)";
    return;
  }

  if (input.connectGamepad()) {
    gamepadDetail = "Xbox 360 virtual ativo";
    return;
  }

  const setupPath = resolveVigemSetupPath();
  if (!setupPath) {
    gamepadDetail =
      "ViGEmBus ausente — rode pnpm --filter @virtual-shock/desktop download-vigem";
    console.warn("[main]", gamepadDetail);
    return;
  }

  input.getGamepad().setStatus("installing");
  gamepadDetail = "Instalando ViGEmBus (aceite o UAC)...";
  sessionServer?.notifyInfo();
  pushHostUpdate();

  const result = await installVigemBusElevated(setupPath);
  if (!result.ok) {
    input.getGamepad().setStatus("needs_install");
    gamepadDetail = result.error ?? "Falha ao instalar ViGEmBus";
    console.warn("[main] ViGEm install failed:", gamepadDetail);
    sessionServer?.notifyInfo();
    pushHostUpdate();
    return;
  }

  // Give the driver a moment to come online.
  await new Promise((r) => setTimeout(r, 1500));

  if (input.connectGamepad()) {
    gamepadDetail = "Xbox 360 virtual ativo (ViGEmBus instalado)";
  } else {
    gamepadDetail =
      "ViGEmBus instalado, mas o pad não conectou — tente reiniciar o app";
    input.getGamepad().setStatus("unavailable");
  }
  sessionServer?.notifyInfo();
  pushHostUpdate();
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 700,
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
  inputService = new InputService();
  const pairingCode = generatePairingCode();
  const staticRoot = resolveStaticRoot();
  console.log(`[main] Serving mobile UI from ${staticRoot}`);

  sessionServer = new SessionServer({
    input: inputService,
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

  await ensureGamepad(inputService);
  sessionServer.notifyInfo();
}

function registerIpc(): void {
  ipcMain.handle("host:getInfo", async () => {
    return {
      ...(latestInfo ?? {
        port: DEFAULT_PORT,
        pairingCode: "------",
        addresses: [],
        clientConnected: false,
        gamepadStatus: "unavailable" as const,
      }),
      qrDataUrl,
      gamepadDetail,
    };
  });

  ipcMain.handle("host:rotateCode", async () => {
    if (!sessionServer) {
      return null;
    }
    const code = generatePairingCode();
    sessionServer.rotatePairingCode(code);
    return {
      ...sessionServer.getInfo(),
      qrDataUrl,
      gamepadDetail,
    };
  });

  ipcMain.handle("host:retryGamepad", async () => {
    if (!inputService) {
      return null;
    }
    await ensureGamepad(inputService);
    sessionServer?.notifyInfo();
    return {
      ...(sessionServer?.getInfo() ?? latestInfo),
      qrDataUrl,
      gamepadDetail,
    };
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
    inputService?.dispose();
    void sessionServer?.stop();
  });
}
