/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
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
  cacheDir: '../../node_modules/.vite/apps/artcraft-webapp',
  server:{
    port: 4201,
    host: 'localhost',
    proxy: {
      // Forward API calls to production API to avoid CORS during local dev
      '/v1': {
        target: 'https://api.storyteller.ai',
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: 'https://api.storyteller.ai',
        },
      },
      // Dev-only CDN proxy. Media assets (splats, GLBs, images) are fetched
      // from the CDN with fetch(), but the CDN only sends CORS headers for the
      // production origin — not localhost. The web adapter's fetchAsset rewrites
      // absolute CDN URLs to `/__cdn/<host>/<path>` in DEV; this forwards them
      // server-side (no browser CORS). The target host is taken from the path
      // so any cdn-N.fakeyou.com / Cloudflare host works.
      '/__cdn': {
        target: 'https://cdn-2.fakeyou.com',
        changeOrigin: true,
        secure: true,
        router: (req) => {
          const match = req.url?.match(/^\/__cdn\/([^/]+)/);
          return match ? `https://${match[1]}` : 'https://cdn-2.fakeyou.com';
        },
        rewrite: (path) => path.replace(/^\/__cdn\/[^/]+/, ''),
      },
    },
  },
  preview:{
    port: 4301,
    host: 'localhost',
  },
  plugins: [generateNewsPlugin(), nxViteTsPaths(), react(), wasm(), topLevelAwait()],
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
