// Bundles the extension and the shared Loom language service into dist/extension.js.
import { build } from 'esbuild'
import { fileURLToPath } from 'url'
import path from 'path'

const here = path.dirname(fileURLToPath(import.meta.url))

await build({
  entryPoints: [path.join(here, 'src/extension.ts')],
  outfile: path.join(here, 'dist/extension.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['vscode'],
  // Resolve zod, @openuidev/lang-core, js-yaml… from the repository root.
  nodePaths: [path.join(here, '../../node_modules')],
  define: { 'import.meta.env': '{}' },
  sourcemap: true,
  minify: true,
  logLevel: 'info',
})
