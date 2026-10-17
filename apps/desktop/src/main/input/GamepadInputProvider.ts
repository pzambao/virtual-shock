import { createRequire } from "node:module";

export type GamepadStatus =
  | "active"
  | "unavailable"
  | "needs_install"
  | "installing"
  | "stub";

interface ViGEmAxis {
  setValue(value: number): void;
  reset(): void;
}

interface ViGEmController {
  connect(opts?: Record<string, unknown>): Error | null;
  disconnect(): Error | null;
  resetInputs(): void;
  axis: {
    leftX: ViGEmAxis;
    leftY: ViGEmAxis;
  };
}

interface ViGEmClientInstance {
  connect(): Error | null;
  createX360Controller(): ViGEmController;
}

type ViGEmClientCtor = new () => ViGEmClientInstance;

const require = createRequire(import.meta.url);

function clampAxis(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(-1, value));
}

export class GamepadInputProvider {
  readonly kind = "gamepad" as const;
  private status: GamepadStatus;
  private controller: ViGEmController | null = null;

  constructor() {
    this.status = process.platform === "win32" ? "unavailable" : "stub";
  }

  getStatus(): GamepadStatus {
    return this.status;
  }

  setStatus(status: GamepadStatus): void {
    this.status = status;
  }

  /**
   * Connect to ViGEmBus and plug in a virtual Xbox 360 pad.
   * On non-Windows platforms, uses a log stub and returns true.
   */
  connect(): boolean {
    if (process.platform !== "win32") {
      this.status = "stub";
      return true;
    }

    let ViGEmClient: ViGEmClientCtor;
    try {
      ViGEmClient = require("vigemclient") as ViGEmClientCtor;
    } catch (err) {
      console.warn("[GamepadInputProvider] vigemclient not available", err);
      this.status = "needs_install";
      this.controller = null;
      return false;
    }

    try {
      const client = new ViGEmClient();
      const connectErr = client.connect();
      if (connectErr) {
        console.warn(
          "[GamepadInputProvider] ViGEmBus connect failed:",
          connectErr.message,
        );
        this.status = "needs_install";
        this.controller = null;
        return false;
      }

      const controller = client.createX360Controller();
      const plugErr = controller.connect();
      if (plugErr) {
        console.warn(
          "[GamepadInputProvider] X360 connect failed:",
          plugErr.message,
        );
        this.status = "unavailable";
        this.controller = null;
        return false;
      }

      this.controller = controller;
      this.status = "active";
      console.log("[GamepadInputProvider] Virtual Xbox 360 controller active");
      return true;
    } catch (err) {
      console.warn("[GamepadInputProvider] Unexpected error:", err);
      this.status = "needs_install";
      this.controller = null;
      return false;
    }
  }

  setLeftStick(x: number, y: number): void {
    const nx = clampAxis(x);
    const ny = clampAxis(y);

    if (this.status === "stub") {
      console.log(
        `[GamepadInputProvider:stub] left stick x=${nx.toFixed(3)} y=${ny.toFixed(3)}`,
      );
      return;
    }

    if (!this.controller || this.status !== "active") {
      return;
    }

    this.controller.axis.leftX.setValue(nx);
    this.controller.axis.leftY.setValue(ny);
  }

  reset(): void {
    if (this.status === "stub") {
      console.log("[GamepadInputProvider:stub] reset stick");
      return;
    }
    if (!this.controller || this.status !== "active") {
      return;
    }
    this.controller.resetInputs();
  }

  dispose(): void {
    try {
      this.controller?.disconnect();
    } catch {
      // ignore
    }
    this.controller = null;
    if (this.status === "active") {
      this.status = "unavailable";
    }
  }
}
