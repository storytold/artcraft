import * as path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  resolve: { alias: { "~": path.resolve(__dirname, "app/src") } },
  test: {
    environment: "jsdom",
    include: ["app/src/**/*.spec.{ts,tsx}"],
  },
});
