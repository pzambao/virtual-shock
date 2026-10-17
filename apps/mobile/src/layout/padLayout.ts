export type PadControlId =
  | "lt"
  | "lb"
  | "rt"
  | "rb"
  | "dpad"
  | "face"
  | "stickLeft"
  | "stickRight"
  | "guideTop"
  | "guideBottom"
  | "back"
  | "start"
  | "touchpad";

/** Position/size in % of the gamepad shell (0–100). */
export interface PadRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type PadLayoutMap = Record<PadControlId, PadRect>;

export const PAD_LAYOUT_STORAGE_KEY = "virtual-shock.pad-layout.v2";

/**
 * Default DualSense-like placement.
 * For square controls (dpad/face/sticks/guide), `w` is the size; `h` is ignored
 * at render (aspect-ratio 1) so landscape screens don't stretch them.
 */
export const DEFAULT_PAD_LAYOUT: PadLayoutMap = {
  lt: { x: 2, y: 3, w: 9, h: 8 },
  lb: { x: 12, y: 5, w: 9, h: 8 },
  dpad: { x: 6, y: 20, w: 14, h: 14 },
  stickLeft: { x: 16, y: 58, w: 13, h: 13 },
  guideTop: { x: 47, y: 4, w: 5, h: 5 },
  back: { x: 30, y: 28, w: 4, h: 18 },
  touchpad: { x: 35, y: 22, w: 30, h: 36 },
  start: { x: 66, y: 28, w: 4, h: 18 },
  guideBottom: { x: 47, y: 68, w: 7, h: 12 },
  rb: { x: 79, y: 5, w: 9, h: 8 },
  rt: { x: 89, y: 3, w: 9, h: 8 },
  face: { x: 80, y: 20, w: 14, h: 14 },
  stickRight: { x: 71, y: 58, w: 13, h: 13 },
};

/** Kept visually square via width% + aspect-ratio (not height%). */
export const SQUARE_CONTROLS: ReadonlySet<PadControlId> = new Set([
  "dpad",
  "face",
  "stickLeft",
  "stickRight",
  "guideTop",
]);

export function clampRect(rect: PadRect): PadRect {
  const w = Math.min(60, Math.max(4, rect.w));
  const h = Math.min(70, Math.max(4, rect.h));
  return {
    w,
    h,
    x: Math.min(100 - w, Math.max(0, rect.x)),
    y: Math.min(100 - h, Math.max(0, rect.y)),
  };
}

export function loadPadLayout(): PadLayoutMap {
  try {
    const raw = localStorage.getItem(PAD_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PAD_LAYOUT };
    }
    const parsed = JSON.parse(raw) as Partial<PadLayoutMap>;
    const next = { ...DEFAULT_PAD_LAYOUT };
    for (const key of Object.keys(DEFAULT_PAD_LAYOUT) as PadControlId[]) {
      const value = parsed[key];
      if (
        value &&
        typeof value.x === "number" &&
        typeof value.y === "number" &&
        typeof value.w === "number" &&
        typeof value.h === "number"
      ) {
        next[key] = clampRect(value);
      }
    }
    return next;
  } catch {
    return { ...DEFAULT_PAD_LAYOUT };
  }
}

export function savePadLayout(layout: PadLayoutMap): void {
  localStorage.setItem(PAD_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}
