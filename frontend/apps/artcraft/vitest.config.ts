import path from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const workspaceRoot = path.resolve(__dirname, "..", "..");

export default defineConfig({
  root: __dirname,
  plugins: [
    // Same path resolution as vite.config.ts: `~/*` from this app's tsconfig plus the
    // @storyteller/* workspace aliases from tsconfig.base.json (resolved to source).
    // (Cast: the app and the workspace root each install a vite copy, so the plugin's
    // Plugin type comes from a different vite than vitest/config expects. Same plugin at runtime.)
    tsconfigPaths({
      projects: [
        path.resolve(__dirname, "tsconfig.json"),
        path.resolve(workspaceRoot, "tsconfig.base.json"),
      ],
    }) as never,
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@preact/signals-core", "@preact/signals-react"],
  },
  test: {
    environment: "jsdom",
    // app/src specs are written for vitest; test/** holds the ApiManager suites, which use
    // jest-style globals (describe/it/expect/jest.spyOn).
    include: ["app/src/**/*.spec.{ts,tsx}", "test/**/*.test.ts"],
    globals: true,
    setupFiles: ["test/setup/jestCompat.ts"],
  },
});
