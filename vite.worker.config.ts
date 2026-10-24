import { defineConfig } from 'vite'
import path from 'path'

/**
 * The hosted Loom MCP endpoint as one Cloudflare Workers module
 * (`dist-worker/worker.mjs`, slice 5), dependencies included; `wrangler.toml`
 * deploys it with `dist/` as its static assets. The `workerd` condition picks
 * the MCP SDK's Workers build, whose JSON Schema validator needs no `eval`.
 */
export default defineConfig({
  publicDir: false,
  resolve: {
    conditions: ['workerd', 'worker', 'browser'],
    // The published prompt instead of building it on each request (src/mcp/worker-prompt.ts)
    alias: [{ find: /^\.\/authoring-prompt$/, replacement: path.resolve(process.cwd(), 'src/mcp/worker-prompt.ts') }],
  },
  build: {
    ssr: path.resolve(process.cwd(), 'src/mcp/worker.ts'),
    outDir: 'dist-worker',
    target: 'es2022',
    minify: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return
        warn(warning)
      },
      output: { entryFileNames: 'worker.mjs', format: 'es', inlineDynamicImports: true },
    },
  },
  ssr: { noExternal: true, target: 'webworker', resolve: { conditions: ['workerd', 'worker', 'browser'], externalConditions: ['workerd', 'worker'] } },
})
