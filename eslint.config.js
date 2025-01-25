import js from '@eslint/js'
import globals from 'globals'

import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/scripts/lib/mt.js',
      '**/scripts/lib/ipc/',
      '**/scripts/lib/SRCItemDatabase.js',
    ]
  },
  js.configs.recommended,
  { 
    languageOptions: { 
      sourceType: "module",
      globals: {
        ...globals.node
      }
    } 
  },
  includeIgnoreFile(gitignorePath),
];