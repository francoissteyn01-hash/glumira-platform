// Flat config (eslint 9). See: https://eslint.org/docs/latest/use/configure/configuration-files
import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // ── Ignored paths ──────────────────────────────────────────────────────
  {
    ignores: [
      '.iob-hunter-rollback-2026-04-10/**',
      'auto-ship.py',
      'dist/**',
      'drizzle/**',
      'glumira-platform/**',
      'node_modules/**',
    ],
  },

  // ── Base JS rules ──────────────────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript rules ───────────────────────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Project rules (TS + React + a11y) ──────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      sourceType: 'module',
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: '18.3' },
    },
    rules: {
      // ── Legacy migration safety ────────────────────────────────────────
      // Keep lint non-blocking while existing debt is reduced incrementally.
      'no-empty': 'warn',
      'no-useless-assignment': 'warn',
      'no-var': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',

      // ── Project conventions from CLAUDE.md ───────────────────────────
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          message:
            'Use string literal unions instead of enums (CLAUDE.md project convention).',
          selector: 'TSEnumDeclaration',
        },
      ],

      // ── React ────────────────────────────────────────────────────────
      'react/prop-types': 'off', // TypeScript handles prop validation
      'react/react-in-jsx-scope': 'off', // jsx: react-jsx auto-imports
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // ── Accessibility ────────────────────────────────────────────────
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
    },
  },

  // ── Test files ─────────────────────────────────────────────────────────
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'e2e/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ── Service worker globals ─────────────────────────────────────────────
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
