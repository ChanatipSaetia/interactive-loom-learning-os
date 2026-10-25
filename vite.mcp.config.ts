import { defineConfig } from 'vite'
import path from 'path'

/**
 * The Loom MCP server as one Node file (`dist-mcp/loom-mcp.mjs`), dependencies
 * included, so it runs with `node` alone (decision 187).
 */
export default defineConfig({
  publicDir: false,
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
