import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  root: __dirname,
  plugins: [tsconfigPaths({ projects: ["../../tsconfig.base.json"] })],
  test: {
    environment: "jsdom",
    include: ["app/src/**/*.spec.{ts,tsx}"],
  },
});
