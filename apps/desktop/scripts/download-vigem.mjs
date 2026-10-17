/**
 * Downloads the official ViGEmBus redistributable into resources/vigem/.
 * MIT-licensed (Nefarius). Required for packaging and first-run auto-install.
 */
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../resources/vigem");
const filename = "ViGEmBus_1.22.0_x64_x86_arm64.exe";
const outPath = join(outDir, filename);
const url =
  "https://github.com/nefarius/ViGEmBus/releases/download/v1.22.0/ViGEmBus_1.22.0_x64_x86_arm64.exe";

mkdirSync(outDir, { recursive: true });

if (existsSync(outPath)) {
  console.log(`ViGEmBus setup already present: ${outPath}`);
  process.exit(0);
}

console.log(`Downloading ViGEmBus setup...\n  ${url}`);
const res = await fetch(url);
if (!res.ok || !res.body) {
  console.error(`Download failed: HTTP ${res.status}`);
  process.exit(1);
}

await pipeline(res.body, createWriteStream(outPath));
console.log(`Saved ${outPath}`);
