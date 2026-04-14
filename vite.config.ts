/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api":  { target: "http://localhost:3001", changeOrigin: true },
      "/trpc": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist/client",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  // Vitest test config (kept here as the canonical source — vitest 4.1.3
  // on Windows wasn't auto-discovering vitest.config.ts at the root,
  // so excludes need to live where vitest is actually reading them).
  // See ARCHIVE-LOG.md (2026-04-10 entry) for the glumira-platform/ context.
  test: {
    environment: "node",
    globals: false,
    include: [
      "client/**/*.{test,spec}.{ts,tsx}",
      "server/**/*.{test,spec}.{ts,tsx}",
      "src/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "dist/**",
      "e2e/**",
      "glumira-platform/**",
    ],
  },
});
