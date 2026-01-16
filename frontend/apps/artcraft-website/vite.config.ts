/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';

// Custom plugin to generate news.json on dev server start
function generateNewsPlugin() {
  return {
    name: 'generate-news',
    buildStart() {
      try {
        const scriptPath = path.resolve(__dirname, '../../scripts/generate-news-json.mjs');
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
      } catch (e) {
        console.warn('Failed to generate news.json:', e);
      }
    },
  };
}

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/artcraft-website',
  server:{
    port: 4200,
    host: 'localhost',
    proxy: {
      // Forward API calls to production API to avoid CORS during local dev
      '/v1': {
        target: 'https://api.storyteller.ai',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview:{
    port: 4300,
    host: 'localhost',
  },
  plugins: [generateNewsPlugin(), react()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
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
    }
  },
}));
