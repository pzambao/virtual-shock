import type { AllowedKey } from "@virtual-shock/shared";
import type { InputProvider } from "./InputProvider.js";

/**
 * Stub extension point for a future real virtual gamepad.
 * Not implemented in the MVP — do not claim gamepad support.
 */
export class GamepadInputProvider implements InputProvider {
  readonly kind = "gamepad" as const;

  keyDown(_key: AllowedKey): void {
    // Future: map buttons to virtual gamepad.
  }

  keyUp(_key: AllowedKey): void {
    // Future: map buttons to virtual gamepad.
  }

  releaseAll(_keys: AllowedKey[]): void {
    // Future: reset virtual gamepad state.
  }
}
