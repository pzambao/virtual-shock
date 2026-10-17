import type { AllowedKey } from "@virtual-shock/shared";

export interface InputProvider {
  readonly kind: "keyboard" | "gamepad";
  keyDown(key: AllowedKey): void;
  keyUp(key: AllowedKey): void;
  releaseAll(keys: AllowedKey[]): void;
}
