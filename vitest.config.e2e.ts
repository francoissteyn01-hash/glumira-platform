/// <reference types="vitest" />
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for end-to-end / integration tests in `e2e/`.
 *
 * Uses jsdom so React components can be mounted via @testing-library/react
 * for high-level smoke tests. This is NOT browser-based e2e — true cross-
 * browser tests will land in Slice 4 via Playwright. The filename and
 * directory layout follow the original Phase 4 spec.
 *
 * Run with: npm run test:e2e
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: [
      '**/node_modules/**',
      'dist/**',
      'glumira-platform/**',
    ],
    globals: false,
    include: ['e2e/**/*.{test,spec}.{ts,tsx}'],
  },
});
