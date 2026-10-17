// Runs `vitest run` inside every package that has a vite/vitest config, one package at a time.
//
// Why not a single root `vitest run` (vitest.workspace.ts)? Some packages need per-package
// settings that do not carry over to the combined run (for example libs/components/video-editor
// loads a .wasm file and fails to start when run from the root, but passes on its own).
// Usage (from frontend/): node tools/testing/run-all-unit-tests.mjs
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const configNames = ["vitest.config.ts", "vite.config.ts", "vitest.config.mts", "vite.config.mts"];
const skip = new Set(["node_modules", "dist", "out-tsc", ".git", "playground"]);

// Walk the tree and collect every directory that holds a vite/vitest config.
const packages = [];
function walk(dir) {
  if (configNames.some((n) => existsSync(path.join(dir, n)))) packages.push(dir);
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (skip.has(entry) || !statSync(full).isDirectory()) continue;
    walk(full);
  }
}
for (const top of ["apps", "libs"]) walk(path.join(root, top));

const failed = [];
for (const dir of packages) {
  const rel = path.relative(root, dir);
  console.log(`\n=== ${rel} ===`);
  // --passWithNoTests: a package with no spec files is not a failure.
  const result = spawnSync("npx", ["vitest", "run", "--passWithNoTests"], { cwd: dir, stdio: "inherit" });
  if (result.status !== 0) failed.push(rel);
}

console.log(`\n${packages.length} packages run, ${failed.length} failed.`);
if (failed.length) {
  console.log(failed.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
