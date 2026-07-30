/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { execSync } from 'child_process';
import path from 'path';

// Dev-only CDN proxy. Media assets (splats, GLBs, images) are fetched with
// fetch(), but the CDNs only send CORS headers for the production origin —
// not localhost. The web adapter's fetchAsset rewrites absolute CDN URLs to
// `/__cdn/<host>/<path>` in DEV; this middleware forwards them server-side
// (no browser CORS) to whatever host is embedded in the path.
//
// NB: This must be a middleware, not a `server.proxy` entry. The previous
// proxy config used a `router` option to pick the target host from the path,
// but `router` is an http-proxy-middleware feature — Vite's http-proxy
// silently ignores it, so every request went to the hardcoded default target
// and any asset on a different host (e.g. the dev R2 bucket) came back 403.
function cdnProxyPlugin() {
  return {
    name: 'cdn-proxy',
    configureServer(server: {
      middlewares: {
        use: (
          route: string,
          handler: (
            req: import('http').IncomingMessage,
            res: import('http').ServerResponse,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use('/__cdn', async (req, res) => {
        try {
          // Connect strips the `/__cdn` mount prefix from req.url.
          const match = (req.url ?? '').match(/^\/([^/?]+)(\/[^?]*)?(\?.*)?$/);
          if (!match) {
            res.statusCode = 400;
            res.end('Bad /__cdn path; expected /__cdn/<host>/<path>');
            return;
          }
          const [, host, assetPath = '/', query = ''] = match;
          // Localhost upstreams (the fully-local dev backend) are plain
          // HTTP; everything else (real CDNs) is HTTPS. The web adapter
          // fetches localhost directly and never proxies it, but don't let
          // a stray localhost request die on a TLS handshake.
          const scheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? 'http' : 'https';
          const upstream = await fetch(`${scheme}://${host}${assetPath}${query}`, {
            method: req.method === 'HEAD' ? 'HEAD' : 'GET',
            headers: req.headers.range
              ? { range: String(req.headers.range) }
              : undefined,
          });
          res.statusCode = upstream.status;
          for (const header of [
            'content-type',
            'content-length',
            'accept-ranges',
            'content-range',
            'etag',
            'cache-control',
          ]) {
            const value = upstream.headers.get(header);
            if (value) res.setHeader(header, value);
          }
          const body = Buffer.from(await upstream.arrayBuffer());
          res.end(body);
        } catch (e) {
          res.statusCode = 502;
          res.end(`CDN proxy error: ${e}`);
        }
      });
    },
  };
}

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
      // Fallback only: main.tsx calls setDevelopment() in DEV, which points
      // all API traffic at http://localhost:12345 directly, bypassing this
      // proxy entirely. Target the local backend too so nothing can silently
      // fall back to production traffic during local dev.
      '/v1': {
        target: 'http://localhost:12345',
        changeOrigin: true,
        secure: false,
      },
      // NB: `/__cdn` asset proxying lives in `cdnProxyPlugin` above — it
      // needs per-request host routing, which `server.proxy` can't do.
    },
  },
  preview:{
    port: 4301,
    host: 'localhost',
  },
  plugins: [cdnProxyPlugin(), generateNewsPlugin(), nxViteTsPaths(), react(), wasm(), topLevelAwait()],
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
