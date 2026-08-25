import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Tests run inside workerd with the bindings from wrangler.toml's top-level (local) block.
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.toml" } })],
  test: {
    include: ["test/**/*.test.ts", "fake-upstream/test/**/*.test.ts"],
  },
});
