// Vite worker-import shim (used by convertFbxToGlb.ts). `?worker&inline`
// bundles the worker as SELF-CONTAINED inline code — the only worker form
// that survives being built into this library's dist and then re-bundled by
// a consuming app's vite build. The `new Worker(new URL(...))` pattern does
// not: the lib build rewrites it to a hashed asset path that the consumer's
// worker-import-meta-url plugin then fails to resolve as an entry module.
declare module "*?worker&inline" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
