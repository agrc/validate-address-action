// @ts-check

import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.github/',
      'package.json',
      'package-lock.json',
      '.emulator-data/',
      '.husky/',
      '.vscode/',
      'coverage/',
      'firebase-export-*/',
      'public/assets/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 12,
      sourceType: 'module',
    },
  },
);
