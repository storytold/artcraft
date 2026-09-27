import { execFileSync } from "node:child_process";
import { relative } from "node:path";

// Benchmark-only instrumentation. The normal desktop build never uses this plugin.
export function benchmarkPlugin({ baselineRef, frontend } = {}) {
  // Reproduce this experiment without checking out over local work. This is a
  // two-module overlay, not a build of an entire historical repository.
  const baseline = new Map();
  if (baselineRef) {
    for (const path of ["pages/MainApp.tsx", "pages/Stores/TabState.ts"]) {
      baseline.set(`/apps/artcraft/app/src/${path}`, execFileSync("git", ["show", `${baselineRef}:frontend/apps/artcraft/app/src/${path}`], { cwd: frontend, encoding: "utf8" }));
    }
  }
  const exports = new Map([
    ["/pages/Stores/TabState.ts", ["tabs", "useTabStore"]],
    ["/pagedraw/src/lib/stores/SceneState.ts", ["scene", "useSceneStore"]],
    ["/pagedraw/src/lib/Node.ts", ["Node", "Node"]],
  ]);
  return {
    name: "artcraft-performance-fixtures",
    enforce: "pre",
    transform(code, id) {
      const source = [...baseline].find(([suffix]) => id.endsWith(suffix));
      if (source) code = source[1];
      for (const [suffix, [key, value]] of exports) {
        if (id.endsWith(suffix)) {
          return `${code}\nwindow.__ARTCRAFT_BENCH__ ??= {};\nwindow.__ARTCRAFT_BENCH__.${key} = ${value};\n`;
        }
      }
      if (source) return code;
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const chunks = Object.values(bundle).filter((item) => item.type === "chunk");
        this.emitFile({
          type: "asset",
          fileName: "performance-bundle.json",
          source: JSON.stringify(chunks.map((chunk) => ({
            file: chunk.fileName,
            entry: chunk.isEntry,
            dynamicEntry: chunk.isDynamicEntry,
            bytes: Buffer.byteLength(chunk.code),
            imports: chunk.imports,
            largestModules: Object.entries(chunk.modules)
              .sort((a, b) => b[1].renderedLength - a[1].renderedLength)
              .slice(0, 25)
              .map(([id, module]) => ({ module: relative(frontend, id), renderedBytes: module.renderedLength })),
          })), null, 2),
        });
      },
    },
  };
}
