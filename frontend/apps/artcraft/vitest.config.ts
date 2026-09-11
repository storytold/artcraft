import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  test: {
    environment: "jsdom",
    include: ["app/src/**/*.spec.{ts,tsx}"],
  },
});
