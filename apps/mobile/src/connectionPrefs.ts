const STORAGE_KEY = "virtual-shock.connection.v1";

export interface ConnectionPrefs {
  host: string;
  pairingCode: string;
}

export function loadConnectionPrefs(): Partial<ConnectionPrefs> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Partial<ConnectionPrefs>;
    return {
      host: typeof parsed.host === "string" ? parsed.host : undefined,
      pairingCode:
        typeof parsed.pairingCode === "string" ? parsed.pairingCode : undefined,
    };
  } catch {
    return {};
  }
}

export function saveConnectionPrefs(prefs: ConnectionPrefs): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      host: prefs.host.trim(),
      pairingCode: prefs.pairingCode.trim(),
    }),
  );
}
