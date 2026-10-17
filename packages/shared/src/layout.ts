import type { AllowedKey } from "./keys.js";

export type ControlType = "button" | "stick";

export interface ControlItemBase {
  id: string;
  type: ControlType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ButtonControlItem extends ControlItemBase {
  type: "button";
  key: AllowedKey;
}

/** Stick is modeled for future use; not rendered/functional in the MVP. */
export interface StickControlItem extends ControlItemBase {
  type: "stick";
  axisId: string;
}

export type ControlItem = ButtonControlItem | StickControlItem;

export interface ControlLayout {
  id: string;
  name: string;
  items: ControlItem[];
}

/** Default fixed layout used by the mobile MVP UI. */
export const DEFAULT_LAYOUT: ControlLayout = {
  id: "default-wasd",
  name: "WASD Default",
  items: [
    {
      id: "btn-w",
      type: "button",
      label: "W",
      key: "KeyW",
      x: 1,
      y: 0,
      width: 1,
      height: 1,
    },
    {
      id: "btn-a",
      type: "button",
      label: "A",
      key: "KeyA",
      x: 0,
      y: 1,
      width: 1,
      height: 1,
    },
    {
      id: "btn-s",
      type: "button",
      label: "S",
      key: "KeyS",
      x: 1,
      y: 1,
      width: 1,
      height: 1,
    },
    {
      id: "btn-d",
      type: "button",
      label: "D",
      key: "KeyD",
      x: 2,
      y: 1,
      width: 1,
      height: 1,
    },
    {
      id: "btn-space",
      type: "button",
      label: "Space",
      key: "Space",
      x: 0,
      y: 3,
      width: 2,
      height: 1,
    },
    {
      id: "btn-shift",
      type: "button",
      label: "Shift",
      key: "ShiftLeft",
      x: 3,
      y: 0,
      width: 1,
      height: 1,
    },
    {
      id: "btn-ctrl",
      type: "button",
      label: "Ctrl",
      key: "ControlLeft",
      x: 3,
      y: 1,
      width: 1,
      height: 1,
    },
    {
      id: "btn-e",
      type: "button",
      label: "E",
      key: "KeyE",
      x: 3,
      y: 2,
      width: 1,
      height: 1,
    },
  ],
};
