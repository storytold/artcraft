// Vite-provided module features used by the test suite. Declared here rather than via
// `vite/client` so the root package does not need vite as a direct dependency.

declare module "*?raw" {
  const contents: string;
  export default contents;
}

interface ImportMeta {
  glob<T = unknown>(
    pattern: string,
    options?: { query?: string; import?: string; eager?: boolean },
  ): Record<string, T>;
}
