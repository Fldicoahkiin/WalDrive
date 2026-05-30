import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tauri drives the dev server; keep the port fixed and fail loudly if taken so
// tauri.conf.json devUrl stays in sync. See https://v2.tauri.app/start/frontend/vite
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Resolve the bun workspace package straight to its TS source — no build step.
      "@waldrive/shared": fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url)),
    },
  },
  // Vite swallows Rust errors otherwise.
  clearScreen: false,
  server: {
    host: host || false,
    port: 5173,
    strictPort: true,
    hmr: host ? { protocol: "ws", host, port: 5174 } : undefined,
    watch: {
      // The Rust backend rebuilds itself; don't let Vite watch it.
      ignored: ["**/src-tauri/**"],
    },
  },
});
