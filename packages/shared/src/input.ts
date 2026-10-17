export type InputKind = "keyboard" | "gamepad";

export type KeyboardAction = "key_down" | "key_up";

/** Reserved for a future real virtual gamepad (not implemented in MVP). */
export interface GamepadAxisState {
  x: number;
  y: number;
}

export interface GamepadButtonState {
  index: number;
  pressed: boolean;
}
