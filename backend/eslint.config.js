// ESLint v9+ config for backend
import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParserPkg from '@typescript-eslint/parser';
const tsParser = tsParserPkg.default || tsParserPkg;

export default [
  {
    ignores: ["dist/**", "node_modules/**", "scripts/**", "routes/**", "controllers/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.js", "tests/**/*.ts", "tests/**/*.js"],
    ignores: ["dist/**", "node_modules/**", "scripts/**", "routes/**", "controllers/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
      },
      globals: globals.node,
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Add custom rules here
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
];
