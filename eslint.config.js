import js from '@eslint/js'
import globals from 'globals'

import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const gitignorePath = path.resolve(dirname, ".gitignore");

export default [
  {
    ignores: [
      '**/scripts/lib/mt.js',
      '**/scripts/lib/ipc/',
      '**/scripts/lib/SRCItemDatabase/',
      '**/scripts/lib/chestui/'
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
  {
    rules: {
      "no-constructor-return": "error",
      "no-duplicate-imports": "error",
      "no-template-curly-in-string": "error",
      "no-unreachable-loop": "error",
      "no-use-before-define": ["error", { "functions": false }],
      "no-useless-assignment": "error",
      // Suggestions:
      "arrow-body-style": "error",
      "block-scoped-var": "error",
      "camelcase": [ "warn", { "ignoreImports": true } ],
      "curly": ["error", "multi-or-nest", "consistent"],
      "default-case": "error",
      "default-case-last": "error",
      "eqeqeq": ["error", "smart"],
      "func-style": ["error", "declaration", { "allowArrowFunctions": true }],
      "max-classes-per-file": ["error", 1], // { ignoreExpressions: true }
      "max-depth": ["warn"],
      "max-lines": ["warn"],
      "max-lines-per-function": ["warn"],
      "max-params": ["warn"],
      "new-cap": "error",
      "no-else-return": "error",
      "no-lonely-if": "error",
      "no-negated-condition": "error",
      "no-nested-ternary": "error",
      "no-return-assign": "error",
      "no-shadow": "error",
      "no-throw-literal": "error",
      "no-underscore-dangle": "error",
      "no-unneeded-ternary": "error",
      "no-useless-computed-key": "error",
      "no-useless-concat": "error",
      "no-useless-constructor": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "no-warning-comments": "warn",
      "one-var": ["error", "never"],
      "operator-assignment": "error",
      "prefer-const": "error",
      "require-await": "error",
      "yoda": "error"
    }
  },
  {
    files: ["**/__tests__/**"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off"
    }
  }
];