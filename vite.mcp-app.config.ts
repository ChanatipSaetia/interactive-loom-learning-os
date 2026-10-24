import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * The Loom MCP App for GitHub Pages: one `app.js` and one `app.css` at fixed
 * names under a versioned path (`dist/mcp-app/v1/`, decision 182), so the
 * server's `ui://` shell can load them.
 */
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist/mcp-app/v1',
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 8000,
    rollupOptions: {
      input: path.resolve(process.cwd(), 'src/mcp-app/main.tsx'),
      preserveEntrySignatures: false,
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return
        warn(warning)
      },
      output: {
        format: 'es',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: (asset) => (asset.names?.some((n) => n.endsWith('.css')) ? 'app.css' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
})
