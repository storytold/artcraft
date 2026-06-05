import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { resolve } from "node:path";
import wasm from "vite-plugin-wasm";

// NB(bt): This configuration file can specify bundler rollup options, compiler plugins,
// import path resolution, dev server HTTP headers, CORS options, path rewriting, etc.
// Read the vite docs for more: https://vitejs.dev/config/

const SPARK_MODULE_SUBPATH = "/@sparkjsdev/spark/dist/spark.module.js";
const SPARK_WASM_PATTERN =
  /module_or_path = new URL\("(data:application\/wasm;base64,[^"]+)", import\.meta\.url\);/;

const sparkWasmDataUrlFix = (): Plugin => ({
  name: "spark-wasm-data-url-fix",
  enforce: "pre",
  apply: "serve",
  transform(code, id) {
    if (!id.includes(SPARK_MODULE_SUBPATH)) {
      return null;
    }

    const match = code.match(SPARK_WASM_PATTERN);
    if (!match) {
      return null;
    }

    const [, dataUrl] = match;
    const patched = code.replace(
      SPARK_WASM_PATTERN,
      `module_or_path = "${dataUrl}";`,
    );

    return {
      code: patched,
      map: null,
    };
  },
});

const projectRoot = __dirname;
const appRoot = path.resolve(projectRoot, "app");
const workspaceRoot = path.resolve(projectRoot, "..", "..");

export default defineConfig({
  root: appRoot,
  optimizeDeps: {
    exclude: ["@sparkjsdev/spark"],
  },
  build: {
    outDir: path.resolve(projectRoot, "dist"),
    rollupOptions: {
      input: {
        index: resolve(projectRoot, "app/index.html"),
      },
    },
  },
  plugins: [sparkWasmDataUrlFix(), tsconfigPaths(), wasm()],
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@preact/signals-core",
      "@preact/signals-react"
    ],
  },
});
