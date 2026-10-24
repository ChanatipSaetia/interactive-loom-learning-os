import plugin from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['node_modules/', 'dist/', 'dist-lib/', '.vite/', 'tools/*/node_modules/', 'tools/*/dist/', 'spikes/', 'dist-mcp/'] },
  plugin.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Node scripts that drive the Loom MCP test host
    files: ['tests/mcp-host/**/*.{cjs,mjs}'],
    languageOptions: { globals: { ...globals.node, document: 'readonly', window: 'readonly' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
)
