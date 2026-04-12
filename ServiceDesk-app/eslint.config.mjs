import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import servicedeskDs from "./eslint-plugin-servicedesk-ds/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    ignores: ["components/ui/**"],
    plugins: {
      "servicedesk-ds": servicedeskDs,
    },
    rules: {
      "servicedesk-ds/no-raw-colors": "warn",
      "servicedesk-ds/no-arbitrary-z": "warn",
      "servicedesk-ds/no-decorative-tones": "warn",
      "servicedesk-ds/no-brand-opacity-hacks": "warn",
    },
  },
];

export default eslintConfig;
