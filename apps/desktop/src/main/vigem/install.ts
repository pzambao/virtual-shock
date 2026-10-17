import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { app } from "electron";

const execFileAsync = promisify(execFile);

export const VIGEM_SETUP_FILENAME = "ViGEmBus_1.22.0_x64_x86_arm64.exe";

export function resolveVigemSetupPath(): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Packaged: resources/vigem/...
    join(process.resourcesPath ?? "", "vigem", VIGEM_SETUP_FILENAME),
    // Dev: apps/desktop/resources/vigem/... (from dist/main/vigem)
    join(here, "../../../resources/vigem", VIGEM_SETUP_FILENAME),
    join(app.getAppPath(), "resources", "vigem", VIGEM_SETUP_FILENAME),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Launch the bundled ViGEmBus setup elevated (UAC).
 * Uses quiet install; reboot is typically not required.
 */
export async function installVigemBusElevated(
  setupPath: string,
): Promise<{ ok: boolean; code: number | null; error?: string }> {
  if (process.platform !== "win32") {
    return {
      ok: false,
      code: null,
      error: "ViGEmBus só está disponível no Windows",
    };
  }

  const escaped = setupPath.replace(/'/g, "''");
  const ps = [
    `$p = Start-Process -FilePath '${escaped}'`,
    `-ArgumentList '/quiet','/norestart'`,
    `-Verb RunAs -PassThru -Wait;`,
    `if ($null -eq $p) { exit 1223 };`,
    `exit $p.ExitCode`,
  ].join(" ");

  try {
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps],
      { windowsHide: true },
    );
    return { ok: true, code: 0 };
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { status?: number };
    const code = typeof error.status === "number" ? error.status : null;
    if (code === 1223) {
      return {
        ok: false,
        code,
        error: "Instalação cancelada (permissão de administrador necessária)",
      };
    }
    if (code === 0) {
      return { ok: true, code: 0 };
    }
    return {
      ok: false,
      code,
      error: error.message || "Falha ao executar o instalador do ViGEmBus",
    };
  }
}
