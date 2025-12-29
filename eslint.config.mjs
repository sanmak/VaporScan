import { fixupConfigRules } from "@eslint/compat";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginNext from "@next/eslint-plugin-next";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  ...tseslint.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@next/next/no-html-link-for-pages": "off",
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
    ],
  },
];
