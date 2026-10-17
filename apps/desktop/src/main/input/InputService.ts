import { KeyStateTracker, type AllowedKey } from "@virtual-shock/shared";
import type { InputProvider } from "./InputProvider.js";
import {
  GamepadInputProvider,
  type GamepadStatus,
} from "./GamepadInputProvider.js";
import { KeyboardInputProvider } from "./KeyboardInputProvider.js";

export class InputService {
  private readonly tracker = new KeyStateTracker();
  private readonly keyboard: InputProvider;
  private readonly gamepad: GamepadInputProvider;

  constructor(keyboard?: InputProvider, gamepad?: GamepadInputProvider) {
    this.keyboard = keyboard ?? new KeyboardInputProvider();
    this.gamepad = gamepad ?? new GamepadInputProvider();
  }

  getGamepad(): GamepadInputProvider {
    return this.gamepad;
  }

  getGamepadStatus(): GamepadStatus {
    return this.gamepad.getStatus();
  }

  connectGamepad(): boolean {
    return this.gamepad.connect();
  }

  keyDown(key: AllowedKey): void {
    const newlyPressed = this.tracker.press(key);
    if (!newlyPressed) {
      return;
    }
    this.keyboard.keyDown(key);
  }

  keyUp(key: AllowedKey): void {
    const wasPressed = this.tracker.release(key);
    if (!wasPressed) {
      return;
    }
    this.keyboard.keyUp(key);
  }

  setLeftStick(x: number, y: number): void {
    this.gamepad.setLeftStick(x, y);
  }

  releaseAll(): void {
    const keys = this.tracker.releaseAll();
    if (keys.length > 0) {
      console.log(`[InputService] Releasing keys: ${keys.join(", ")}`);
      this.keyboard.releaseAll(keys);
    }
    this.gamepad.reset();
  }

  getPressed(): AllowedKey[] {
    return this.tracker.getPressed();
  }

  dispose(): void {
    this.releaseAll();
    this.gamepad.dispose();
  }
}
