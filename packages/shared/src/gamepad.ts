/** Virtual Xbox 360 pad buttons exposed by the mobile layout. */
export const PAD_BUTTONS = [
  "A",
  "B",
  "X",
  "Y",
  "LB",
  "RB",
  "LT",
  "RT",
  "Back",
  "Start",
  "Guide",
  "L3",
  "R3",
  "DpadUp",
  "DpadDown",
  "DpadLeft",
  "DpadRight",
] as const;

export type PadButton = (typeof PAD_BUTTONS)[number];

export function isPadButton(value: string): value is PadButton {
  return (PAD_BUTTONS as readonly string[]).includes(value);
}

export const STICK_IDS = ["left", "right"] as const;
export type StickId = (typeof STICK_IDS)[number];

export function isStickId(value: string): value is StickId {
  return (STICK_IDS as readonly string[]).includes(value);
}
