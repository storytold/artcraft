import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    // Keep test paths relative to the app workspace while reusing the app's
    // Vite plugins, especially vite-tsconfig-paths for the "~" alias.
    root: __dirname,
    test: {
      environment: "jsdom",
      include: ["app/src/**/*.spec.{ts,tsx}"],
    },
  }),
);
