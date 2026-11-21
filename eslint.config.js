import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Flat config applies only the last matching `no-restricted-imports`, so each layer block repeats the
// restrictions of the blocks it overlaps with.
const HUB_MUST_NOT_IMPORT = {
  group: ['**/jornada', '**/jornada/**'],
  message: 'hub/ e jornada/ não importam um do outro. Mova o que for comum para shared/.',
}
const JORNADA_MUST_NOT_IMPORT = {
  group: ['**/hub', '**/hub/**'],
  message: 'hub/ e jornada/ não importam um do outro. Mova o que for comum para shared/.',
}
const PURE_LAYER_MUST_NOT_IMPORT = {
  group: [
    'react',
    'react-dom',
    'react/*',
    'react-dom/*',
    'firebase',
    'firebase/*',
    '**/ui',
    '**/ui/**',
    '**/application',
    '**/application/**',
    '**/infrastructure',
    '**/infrastructure/**',
  ],
  message:
    'domain/ e content/ são puros: sem React, Firebase, ui/, application/ ou infrastructure/.',
}

export default defineConfig([
  globalIgnores(['dist', '.ai/reference']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features', '**/features/**', '**/app', '**/app/**'],
              message: 'shared/ não conhece as features nem a composição.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/hub/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [HUB_MUST_NOT_IMPORT] }],
    },
  },
  {
    files: ['src/features/jornada/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [JORNADA_MUST_NOT_IMPORT] }],
    },
  },
  {
    files: ['src/features/jornada/{domain,content}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [JORNADA_MUST_NOT_IMPORT, PURE_LAYER_MUST_NOT_IMPORT] },
      ],
    },
  },
  prettier,
])
