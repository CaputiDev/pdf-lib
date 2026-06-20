import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Core layer restrictions (Core cannot import from Application, Infrastructure, UI)
            { target: './src/core', from: './src/application' },
            { target: './src/core', from: './src/infrastructure' },
            { target: './src/core', from: './src/ui' },
            // Application layer restrictions (Application cannot import from Infrastructure, UI)
            { target: './src/application', from: './src/infrastructure' },
            { target: './src/application', from: './src/ui' },
            // Infrastructure layer restrictions (Infrastructure cannot import from UI)
            { target: './src/infrastructure', from: './src/ui' }
          ]
        }
      ]
    }
  }
])
