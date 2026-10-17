/** Allowed keyboard keys for the MVP. */
export const ALLOWED_KEYS = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Space",
  "ShiftLeft",
  "ControlLeft",
  "KeyE",
] as const;

export type AllowedKey = (typeof ALLOWED_KEYS)[number];

export function isAllowedKey(value: string): value is AllowedKey {
  return (ALLOWED_KEYS as readonly string[]).includes(value);
}

/**
 * Windows Virtual-Key codes for SendInput.
 * @see https://learn.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
 */
export const VIRTUAL_KEY_CODES: Record<AllowedKey, number> = {
  KeyW: 0x57,
  KeyA: 0x41,
  KeyS: 0x53,
  KeyD: 0x44,
  Space: 0x20,
  ShiftLeft: 0xA0,
  ControlLeft: 0xA2,
  KeyE: 0x45,
};

export const KEY_LABELS: Record<AllowedKey, string> = {
  KeyW: "W",
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  Space: "Space",
  ShiftLeft: "Shift",
  ControlLeft: "Ctrl",
  KeyE: "E",
};
