import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended,
  globalIgnores([
    ".astro",
    "node_modules", 
    "public"
	]),
  { 
    "rules": {
      "@typescript-eslint/no-unused-vars": ['warn', { argsIgnorePattern: '^_' }]
    }
  }, 
  eslintConfigPrettier
]);
