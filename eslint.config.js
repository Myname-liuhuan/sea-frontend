import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'no-magic-numbers': ['error', {
        ignore: [0, 1, -1],
        ignoreDefaultValues: true,
        ignoreArrayIndexes: true,
      }],
      'max-depth': ['error', 3],
      'max-lines-per-function': ['error', {
        max: 50,
        skipBlankLines: true,
        skipComments: true,
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'vue/no-v-html': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
    },
  },
  {
    files: ['src/hooks/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
  {
    ignores: ['src/auto-imports.d.ts', 'src/components.d.ts', 'dist/', 'node_modules/', 'eslint.config.js'],
  },
]
