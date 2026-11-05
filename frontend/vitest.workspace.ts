export default [
  // Every package's vite config doubles as its vitest config...
  '**/vite.config.{mjs,js,ts,mts}',
  '**/vitest.config.{mjs,js,ts,mts}',
  // ...except apps/artcraft, which has a dedicated vitest.config.ts. Listing both made two projects
  // named "artcraft" and vitest refused to start. Also skip dependencies and build output.
  '!apps/artcraft/vite.config.ts',
  '!apps/artcraft/sb-vite.config.ts',
  // video-editor loads a .wasm file (opencut-wasm) that only resolves when vitest runs inside the
  // package itself. In a shared root run it fails with "Invalid URL /@fs/...". It is still tested:
  // `npm test` (tools/testing/run-all-unit-tests.mjs) runs it from its own folder.
  '!libs/components/video-editor/vite.config.ts',
  '!**/node_modules/**',
  '!**/dist/**',
];
