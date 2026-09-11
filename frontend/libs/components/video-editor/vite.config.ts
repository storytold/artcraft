/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';
import * as path from 'path';
import { isExternal as baseIsExternal } from '../../shared-vite-config';

// OpenCut peer deps that should NEVER bundle into the lib output.
// Consuming apps add these directly to their package.json.
const EXTRA_EXTERNAL_PREFIXES = [
  'opencut-wasm',
  'mediabunny',
  'wavesurfer.js',
  'soundtouchjs',
  '@huggingface/transformers',
  '@radix-ui/',
  '@dnd-kit/',
  'react-hook-form',
  'class-variance-authority',
  'clsx',
  'tailwind-merge',
  'lucide-react',
  'sonner',
  'cmdk',
  '@hugeicons/',
  'use-deep-compare-effect',
  'react-router-dom',
  'framer-motion',
  'react-resizable-panels',
];

function isExternal(id: string): boolean {
  if (baseIsExternal(id)) return true;
  for (const prefix of EXTRA_EXTERNAL_PREFIXES) {
    if (id === prefix || id.startsWith(prefix)) return true;
  }
  return false;
}

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/components/video-editor',
  plugins: [react(), wasm(), dts({ entryRoot: 'src', tsconfigPath: path.join(__dirname, 'tsconfig.lib.json') })],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: '@storyteller/ui-video-editor',
      fileName: 'index',
      formats: ['es' as const]
    },
    rollupOptions: {
      external: isExternal
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    // opencut-wasm is published as ESM with a .wasm asset; vitest's default
    // resolver hits the .wasm file directly without going through vite's
    // transform pipeline. Inlining the package forces vite to process it.
    server: {
      deps: {
        inline: [/opencut-wasm/],
      },
    },
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    }
  },
}));
