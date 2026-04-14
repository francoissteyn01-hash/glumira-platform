/// <reference types="vitest" />
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for unit tests.
 *
 * Excludes are baked in here so contributors don't have to remember the
 * `--exclude` flags every time:
 *   - dist/                    stale build artifacts
 *   - e2e/                     handled by vitest.config.e2e.ts
 *   - glumira-platform/        embedded sub-repo with its own toolchain
 *   - node_modules/            ...
 *
 * NOTE: globals are intentionally OFF. Every test file must explicitly
 * `import { describe, expect, test } from 'vitest'`. Vitest 4.x does not
 * inject these by default and the previous implicit assumption surfaced
 * as `ReferenceError: describe is not defined` (fixed in commit e062267).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      'dist/**',
      'e2e/**',
      'glumira-platform/**',
    ],
    globals: false,
    include: [
      'client/**/*.{test,spec}.{ts,tsx}',
      'server/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
  },
});
