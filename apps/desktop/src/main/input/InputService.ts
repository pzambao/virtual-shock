import { KeyStateTracker, type AllowedKey } from "@virtual-shock/shared";
import type { InputProvider } from "./InputProvider.js";
import { GamepadInputProvider } from "./GamepadInputProvider.js";
import { KeyboardInputProvider } from "./KeyboardInputProvider.js";

export class InputService {
  private readonly tracker = new KeyStateTracker();
  private readonly keyboard: InputProvider;
  /** Reserved for a future real virtual gamepad — unused in the MVP. */
  private readonly gamepad: InputProvider;

  constructor(keyboard?: InputProvider, gamepad?: InputProvider) {
    this.keyboard = keyboard ?? new KeyboardInputProvider();
    this.gamepad = gamepad ?? new GamepadInputProvider();
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

  releaseAll(): void {
    const keys = this.tracker.releaseAll();
    if (keys.length === 0) {
      return;
    }
    console.log(`[InputService] Releasing keys: ${keys.join(", ")}`);
    this.keyboard.releaseAll(keys);
  }

  getPressed(): AllowedKey[] {
    return this.tracker.getPressed();
  }

  /** Exposes providers for future routing (keyboard vs gamepad). */
  getProviders(): { keyboard: InputProvider; gamepad: InputProvider } {
    return { keyboard: this.keyboard, gamepad: this.gamepad };
  }
}
