import { createRequire } from "node:module";
import type { PadButton, StickId } from "@virtual-shock/shared";

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

interface ViGEmButton {
  setValue(value: boolean): void;
}

interface ViGEmController {
  connect(opts?: Record<string, unknown>): Error | null;
  disconnect(): Error | null;
  resetInputs(): void;
  axis: {
    leftX: ViGEmAxis;
    leftY: ViGEmAxis;
    rightX: ViGEmAxis;
    rightY: ViGEmAxis;
    leftTrigger: ViGEmAxis;
    rightTrigger: ViGEmAxis;
    dpadHorz: ViGEmAxis;
    dpadVert: ViGEmAxis;
  };
  button: {
    A: ViGEmButton;
    B: ViGEmButton;
    X: ViGEmButton;
    Y: ViGEmButton;
    LEFT_SHOULDER: ViGEmButton;
    RIGHT_SHOULDER: ViGEmButton;
    BACK: ViGEmButton;
    START: ViGEmButton;
    GUIDE: ViGEmButton;
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

const FACE_MAP: Partial<Record<PadButton, keyof ViGEmController["button"]>> = {
  A: "A",
  B: "B",
  X: "X",
  Y: "Y",
  LB: "LEFT_SHOULDER",
  RB: "RIGHT_SHOULDER",
  Back: "BACK",
  Start: "START",
  Guide: "GUIDE",
};

export class GamepadInputProvider {
  readonly kind = "gamepad" as const;
  private status: GamepadStatus;
  private controller: ViGEmController | null = null;
  private readonly dpad = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  constructor() {
    this.status = process.platform === "win32" ? "unavailable" : "stub";
  }

  getStatus(): GamepadStatus {
    return this.status;
  }

  setStatus(status: GamepadStatus): void {
    this.status = status;
  }

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

  setStick(stick: StickId, x: number, y: number): void {
    const nx = clampAxis(x);
    const ny = clampAxis(y);

    if (this.status === "stub") {
      console.log(
        `[GamepadInputProvider:stub] ${stick} stick x=${nx.toFixed(3)} y=${ny.toFixed(3)}`,
      );
      return;
    }
    if (!this.controller || this.status !== "active") {
      return;
    }

    if (stick === "left") {
      this.controller.axis.leftX.setValue(nx);
      this.controller.axis.leftY.setValue(ny);
    } else {
      this.controller.axis.rightX.setValue(nx);
      this.controller.axis.rightY.setValue(ny);
    }
  }

  setButton(button: PadButton, pressed: boolean): void {
    if (this.status === "stub") {
      console.log(
        `[GamepadInputProvider:stub] ${button} ${pressed ? "DOWN" : "UP"}`,
      );
      return;
    }
    if (!this.controller || this.status !== "active") {
      return;
    }

    if (button === "LT") {
      this.controller.axis.leftTrigger.setValue(pressed ? 1 : 0);
      return;
    }
    if (button === "RT") {
      this.controller.axis.rightTrigger.setValue(pressed ? 1 : 0);
      return;
    }

    if (
      button === "DpadUp" ||
      button === "DpadDown" ||
      button === "DpadLeft" ||
      button === "DpadRight"
    ) {
      if (button === "DpadUp") this.dpad.up = pressed;
      if (button === "DpadDown") this.dpad.down = pressed;
      if (button === "DpadLeft") this.dpad.left = pressed;
      if (button === "DpadRight") this.dpad.right = pressed;
      this.applyDpad();
      return;
    }

    const mapped = FACE_MAP[button];
    if (mapped) {
      this.controller.button[mapped].setValue(pressed);
    }
  }

  private applyDpad(): void {
    if (!this.controller) {
      return;
    }
    let vert = 0;
    if (this.dpad.up) vert += 1;
    if (this.dpad.down) vert -= 1;
    let horz = 0;
    if (this.dpad.right) horz += 1;
    if (this.dpad.left) horz -= 1;
    this.controller.axis.dpadVert.setValue(vert);
    this.controller.axis.dpadHorz.setValue(horz);
  }

  reset(): void {
    this.dpad.up = false;
    this.dpad.down = false;
    this.dpad.left = false;
    this.dpad.right = false;
    if (this.status === "stub") {
      console.log("[GamepadInputProvider:stub] reset");
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
