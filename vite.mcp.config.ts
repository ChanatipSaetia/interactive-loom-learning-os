import { defineConfig } from 'vite'
import path from 'path'
import fs from 'node:fs'
import { inlineMcpApp } from './scripts/inline-mcp-app.mjs'

/**
 * The Loom MCP server as one Node file (`dist-mcp/loom-mcp.mjs`), dependencies
 * included, so it runs with `node` alone (decision 187).
 */
export default defineConfig({
  publicDir: false,
  plugins: [{
    name: 'loom-local-app',
    resolveId(id) {
      if (id === 'virtual:loom-local-app') return '\0loom-local-app'
    },
    load(id) {
      if (id !== '\0loom-local-app') return
      const dir = path.resolve(process.cwd(), 'dist/mcp-app/v1')
      const html = inlineMcpApp(
        fs.readFileSync(path.join(dir, 'app.js'), 'utf8'),
        fs.readFileSync(path.join(dir, 'app.css'), 'utf8'),
        'https://loom-mcp.loom-learning.workers.dev/viewer.html',
      )
      return `export default ${JSON.stringify(html)}`
    },
  }],
  build: {
    ssr: path.resolve(process.cwd(), 'src/mcp/cli.ts'),
    outDir: 'dist-mcp',
    target: 'node20',
    minify: false,
    rollupOptions: {
      // React libraries' "use client" lines mean nothing in a Node bundle.
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return
        warn(warning)
      },
      output: { entryFileNames: 'loom-mcp.mjs', format: 'es', inlineDynamicImports: true },
    },
  },
  ssr: { noExternal: true, target: 'node' },
})
