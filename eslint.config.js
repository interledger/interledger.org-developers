import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import eslintPluginAstro from 'eslint-plugin-astro'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  globalIgnores([
    '**/dist/**',
    '.astro',
    'node_modules',
    'public',
    '**/*.min.js',
    'cms/strapi-server.js',
    'cms/copy-schemas.js',
    'cms/src/admin/app.tsx',
    'cms/src/index.ts',
    'src/pages/financial-services.astro'
  ]),
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'astro/no-set-text-directive': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },
  eslintConfigPrettier
])
