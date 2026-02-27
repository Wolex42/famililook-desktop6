import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE || ''),
      'import.meta.env.VITE_MATCH_SERVER_URL': JSON.stringify(env.VITE_MATCH_SERVER_URL || ''),
      'import.meta.env.VITE_BRAND_HUB_URL': JSON.stringify(env.VITE_BRAND_HUB_URL || ''),
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
    },
    server: {
      port: 5180,
      proxy: {
        "/detect": { target: "http://localhost:8008", changeOrigin: true },
        "/embed": { target: "http://localhost:8008", changeOrigin: true },
        "/face": { target: "http://localhost:8008", changeOrigin: true },
        "/kinship": { target: "http://localhost:8008", changeOrigin: true },
        "/compare": { target: "http://localhost:8008", changeOrigin: true },
        "/analytics": { target: "http://localhost:8008", changeOrigin: true },
      },
    },
    build: {
      target: "esnext",
      sourcemap: false,
      outDir: "dist",
    },
    esbuild: {
      drop: ["console", "debugger"],
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./tests/setup.js",
      css: false,
    },
  };
});
