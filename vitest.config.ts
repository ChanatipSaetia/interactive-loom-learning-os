import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    server: {
      deps: {
        // react-ui's per-component entries (`@openuidev/react-ui/Charts`) use
        // directory imports, which only Vite's resolver (not Node's) handles.
        inline: [/@openuidev\/react-ui/],
      },
    },
  }
})
