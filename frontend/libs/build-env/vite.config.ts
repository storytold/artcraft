
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/build-env',
  plugins: [react(), dts({ entryRoot: 'src', tsconfigPath: path.join(__dirname, 'tsconfig.lib.json') }), ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    'emptyOutDir': true,
    'transformMixedEsModules': true,
    'entry': 'src/index.ts',
    'name': '@frontend/build-env',
    'fileName': 'index',
    'formats': ['es' as const],
    'external': ['react','react-dom','react/jsx-runtime'],
    'lib': {
      'entry': "src/index.ts",
      'name': "@frontend/build-env",
      'fileName': "index",
      'formats': ['es' as const],
    },
    'rollupOptions': {"external":["'react'","'react-dom'","'react/jsx-runtime'"]},
    'outDir': "./dist",
    'reportCompressedSize': true,
    'commonjsOptions': {"transformMixedEsModules":true},
  },
  test: {
    'watch': false,
    'globals': true,
    'environment': "jsdom",
    'include': ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    'reporters': ["default"],
    'coverage': {
    'reportsDirectory': './test-output/vitest/coverage',
    'provider': 'v8' as const,
}
  },
}));
