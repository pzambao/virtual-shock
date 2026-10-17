import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopRoot = join(__dirname, "..");
const mobileDist = join(desktopRoot, "../mobile/dist");
const target = join(desktopRoot, "dist-mobile");

if (!existsSync(mobileDist)) {
  console.error(
    "Mobile build not found at apps/mobile/dist. Run pnpm build:mobile first.",
  );
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(mobileDist, target, { recursive: true });
console.log(`Copied mobile build to ${target}`);
