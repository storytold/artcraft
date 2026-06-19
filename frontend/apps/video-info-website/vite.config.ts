/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/video-info-website',
  server: {
    port: 4250,
    host: 'localhost',
    proxy: {
      // In dev, the browser calls same-origin `/v1/...` and Vite forwards it to
      // the local storyteller-web server — so dev hits http://localhost:12345
      // without any CORS dance. Production builds call api.storyteller.ai
      // directly (see src/api/client.ts).
      '/v1': {
        target: 'http://localhost:12345',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4350,
    host: 'localhost',
  },
  plugins: [nxViteTsPaths(), react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
