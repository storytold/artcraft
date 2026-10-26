import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    include: ["src/*.spec.tsx"],
    pool: "threads",
    maxWorkers: 1,
    minWorkers: 1,
  },
});
