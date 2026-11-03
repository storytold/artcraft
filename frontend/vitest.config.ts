import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Folders that hold one package per subdirectory; mirrors "workspaces" in
// package.json.
const PACKAGE_GROUPS = [
  "apps",
  "libs",
  "libs/analytics",
  "libs/components",
  "libs/state",
];

const CONFIG_FILES = ["vitest.config.ts", "vite.config.ts"];

// Projects are listed as package directories rather than config-file globs.
// Vitest loads one config per directory (vitest.config.* before vite.config.*),
// so a package that keeps both, like apps/artcraft, registers once. Globbing
// the config files registered it twice and aborted every workspace run with
// 'Project name "artcraft" ... is not unique'.
export default defineConfig({
  test: {
    projects: listPackageDirectories(),
  },
});

function listPackageDirectories(): string[] {
  return PACKAGE_GROUPS.flatMap((group) =>
    readdirSync(resolve(__dirname, group), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(group, entry.name))
      .filter(hasProjectConfig),
  );
}

function hasProjectConfig(directory: string): boolean {
  return CONFIG_FILES.some((file) =>
    existsSync(resolve(__dirname, directory, file)),
  );
}
