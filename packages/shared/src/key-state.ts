import type { AllowedKey } from "./keys.js";

/**
 * Tracks which keys are currently held down.
 * Used by the desktop InputService to release all keys on disconnect.
 */
export class KeyStateTracker {
  private readonly pressed = new Set<AllowedKey>();

  press(key: AllowedKey): boolean {
    if (this.pressed.has(key)) {
      return false;
    }
    this.pressed.add(key);
    return true;
  }

  release(key: AllowedKey): boolean {
    return this.pressed.delete(key);
  }

  isPressed(key: AllowedKey): boolean {
    return this.pressed.has(key);
  }

  getPressed(): AllowedKey[] {
    return [...this.pressed];
  }

  releaseAll(): AllowedKey[] {
    const keys = this.getPressed();
    this.pressed.clear();
    return keys;
  }

  clear(): void {
    this.pressed.clear();
  }
}
