import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";
import path from "node:path";
import { isExternal } from "../shared-vite-config";

export default defineConfig({
  root: __dirname,
  esbuild: { jsx: "automatic" },
  plugins: [dts({ entryRoot: "src", tsconfigPath: path.join(__dirname, "tsconfig.lib.json") })],
  build: {
    outDir: "dist",
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index" },
    rollupOptions: { external: isExternal },
  },
  test: { environment: "jsdom", include: ["src/*.spec.tsx"] },
});
