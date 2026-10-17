/**
 * Materialize workspace dependency @virtual-shock/shared inside apps/desktop
 * so electron-builder can pack without following pnpm links outside the app dir.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopRoot = join(__dirname, "..");
const sharedRoot = join(desktopRoot, "../../packages/shared");
const destRoot = join(desktopRoot, "node_modules/@virtual-shock/shared");

if (!existsSync(join(sharedRoot, "dist/index.js"))) {
  console.error("shared dist missing — run pnpm build:shared first");
  process.exit(1);
}

rmSync(destRoot, { recursive: true, force: true });
mkdirSync(destRoot, { recursive: true });

cpSync(join(sharedRoot, "dist"), join(destRoot, "dist"), { recursive: true });

const pkg = JSON.parse(readFileSync(join(sharedRoot, "package.json"), "utf8"));
const slim = {
  name: pkg.name,
  version: pkg.version,
  type: pkg.type,
  main: pkg.main,
  types: pkg.types,
  exports: pkg.exports,
};
writeFileSync(join(destRoot, "package.json"), JSON.stringify(slim, null, 2));
console.log(`Materialized ${destRoot}`);
