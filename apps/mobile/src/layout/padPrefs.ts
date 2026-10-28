const STORAGE_KEY = "virtual-shock.pad-prefs.v1";

export interface PadPrefs {
  /** Slide a finger from one pad button onto another without lifting. */
  slideButtons: boolean;
}

const DEFAULT_PREFS: PadPrefs = {
  slideButtons: false,
};

export function loadPadPrefs(): PadPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFS };
    }
    const parsed = JSON.parse(raw) as Partial<PadPrefs>;
    return {
      slideButtons: parsed.slideButtons === true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePadPrefs(prefs: PadPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
