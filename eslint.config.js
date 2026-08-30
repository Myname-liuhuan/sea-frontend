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
      globals: {
        // 浏览器全局（Vue file 的 <script setup> 不自动继承 tsconfig DOM lib）
        window: 'readonly',
        document: 'readonly',
        WebSocket: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        location: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        // DOM 类型（no-undef 不读 tsconfig lib，只能手列）
        Element: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        ResizeObserver: 'readonly',
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
