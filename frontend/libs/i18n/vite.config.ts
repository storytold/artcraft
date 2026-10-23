import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@storyteller/i18n",
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}", "build/**/*.spec.ts"],
  },
  root: __dirname,
});
