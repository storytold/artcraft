import { defineConfig, loadEnv } from "vite";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env = { ...process.env, ...env };

  return {
    // no Remix Vite plugin here
    plugins: [nxViteTsPaths()],
  };
});
