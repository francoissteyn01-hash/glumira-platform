/**
 * GluMira™ V7 — vite.config.ts
 *
 * Vite configuration for the client app.
 * Confirmed architecture: Vite + React (Drive Auditor v2.0, 2026-03-28)
 *
 * Key configuration:
 *  - @/ alias → src/ (matches all existing component imports)
 *  - Proxy /api/* → Express server on :3001
 *  - Port: 5173 (default)
 *
 * Version: v1.0 · 2026-03-29
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // Matches all "@/" imports used throughout client components
      // e.g. "@/hooks/useWeeklySummary" → "src/hooks/useWeeklySummary"
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
    proxy: {
      // Proxy all /api/* requests to Express server
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split recharts into its own chunk (it's large)
        manualChunks: {
          recharts: ["recharts"],
          react:    ["react", "react-dom"],
        },
      },
    },
  },
});
