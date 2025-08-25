import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          vars: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-readonly": "warn", // Changed from error to warn

      // Code quality rules - relaxed for now
      complexity: ["warn", 25], // Increased from 15 to 25
      "max-depth": ["error", 3],
      "max-lines-per-function": ["warn", { max: 70, skipComments: true }], // Increased from 50 to 70
      "max-params": ["error", 7],
      "prefer-const": "error",
      "no-var": "error",

      // General rules
      "no-console": "warn", // Allow console for now
      "no-debugger": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Allow unused vars prefixed with _
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "max-lines-per-function": "off",
    },
  },
  prettier,
];
