import js from '@eslint/js'
import tseslintPlugin from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import eslintPluginAstro from 'eslint-plugin-astro'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      '.astro',
      '*.d.ts',
      '**/*.min.js',
      'public/scripts/init.js'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        NodeListOf: 'readonly'
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules,
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    files: ['*.astro'],
    plugins: {
      astro: eslintPluginAstro
    },
    languageOptions: {
      parser: eslintPluginAstro.parser,
      parserOptions: {
        parser: tsparser,
        extraFileExtensions: ['.astro']
      }
    },
    rules: {
      ...eslintPluginAstro.configs.recommended.rules,
      'astro/no-set-text-directive': 'error'
    }
  },
  prettierConfig
]
