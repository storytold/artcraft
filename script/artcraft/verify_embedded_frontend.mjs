import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";

// Usage: node verify_embedded_frontend.mjs [exe] [frontend-dist]
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const distRoot = process.argv[3]
  ? resolve(process.argv[3])
  : join(repoRoot, "frontend", "apps", "artcraft", "dist");
const buildRoot = join(repoRoot, "target", "release", "build");
const exePath = process.argv[2]
  ? resolve(process.argv[2])
  : join(repoRoot, "target", "release", "artcraft.exe");

try {
  const index = readFileSync(join(distRoot, "index.html"), "utf8");
  const entry = index.match(/\/assets\/index-[^"'\s]+\.js/)?.[0];
  if (!entry || !existsSync(join(distRoot, entry.slice(1)))) {
    throw new Error("Built frontend entry is missing from dist");
  }

  const exe = readFileSync(exePath);
  for (const build of readdirSync(buildRoot, { withFileTypes: true })) {
    if (!build.isDirectory() || !build.name.startsWith("artcraft-")) continue;
    const assets = join(buildRoot, build.name, "out", "tauri-codegen-assets");
    if (!existsSync(assets)) continue;

    for (const asset of readdirSync(assets)) {
      if (!asset.endsWith(".html")) continue;
      const compressed = readFileSync(join(assets, asset));
      try {
        if (
          !brotliDecompressSync(compressed).toString("utf8").includes(entry)
        ) {
          continue;
        }
      } catch {
        continue;
      }
      if (exe.includes(compressed)) {
        console.log(`Verified embedded frontend: ${entry}`);
        process.exit(0);
      }
    }
  }

  throw new Error(
    "Release EXE does not embed the current frontend; use cargo tauri build",
  );
} catch (error) {
  console.error(`Embedded frontend verification failed: ${error.message}`);
  process.exitCode = 1;
}
