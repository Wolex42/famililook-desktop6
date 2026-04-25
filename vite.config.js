import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = process.env.VITE_API_BASE || 'http://127.0.0.1:8008';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_');

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    server: {
      port: 5174,
      strictPort: false,
      host: true,
      proxy: {
        '/compare':    { target, changeOrigin: true },
        '/detect':     { target, changeOrigin: true },
        '/embed':      { target, changeOrigin: true },
        '/attributes': { target, changeOrigin: true },
        '/analytics':  { target, changeOrigin: true },
        '/status':     { target, changeOrigin: true },
        '/version':    { target, changeOrigin: true },
        '/subscribe':  { target, changeOrigin: true },
        '/feedback':   { target, changeOrigin: true },
        '/face':       { target, changeOrigin: true },
      },
    },

    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE || ''),
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
      'import.meta.env.VITE_BRAND_HUB_URL': JSON.stringify(env.VITE_BRAND_HUB_URL || ''),
    },

    build: {
      target: 'esnext',
      sourcemap: false,
      outDir: 'dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: 'index.html',
      },
    },

    esbuild: {
      drop: ['console', 'debugger'],
    },

    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setupTests.js'],
      include: ['tests/**/*.test.{ts,tsx,js,jsx}'],
      globals: true,
      css: true,
      // CI parity: ResultsStory feature flag must be ON for the
      // shared-journey path (where the new extraAction tests live).
      // Set in Vercel for prod; mirror it here so `npm run test:run`
      // produces the same result locally and in CI regardless of shell env.
      env: {
        VITE_USE_SHARED_JOURNEY: 'true',
      },
    },
  };
});
