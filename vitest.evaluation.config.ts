import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    globals: true, environment: 'jsdom', setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/evaluation/**/*.test.{ts,tsx}', 'tests/unit/mcp/continuity.test.ts'],
    maxWorkers: 2, minWorkers: 1,
    server: { deps: { inline: [/@openuidev\/react-ui/] } },
  },
})
