/** Build the permanent all-section review topic into a single, offline Viewer HTML. */
import { build } from 'vite'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateRawSync } from 'node:zlib'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import console from 'node:console'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(process.argv[2] ?? join(tmpdir(), 'viewer-review-demo.html'))
const buildDir = await mkdtemp(join(tmpdir(), 'loom-viewer-review-'))
// Tailwind resolves its configuration relative to the working directory.
process.chdir(root)
try {
  await build({
    root,
    configFile: join(root, 'vite.config.ts'),
    plugins: [{ name: 'single-viewer-demo', configResolved(config) {
      config.build.rollupOptions.input = { viewer: join(root, 'viewer.html') }
      config.build.rollupOptions.output = { inlineDynamicImports: true }
    } }],
    build: { outDir: buildDir, emptyOutDir: true, copyPublicDir: false, assetsInlineLimit: 20_000_000, cssCodeSplit: false },
  })
  let html = await readFile(join(buildDir, 'viewer.html'), 'utf8')
  for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
    const js = await readFile(join(buildDir, match[1].replace(/^\//, '')), 'utf8')
    html = html.replace(match[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`)
  }
  for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]) {
    const css = await readFile(join(buildDir, match[1].replace(/^\//, '')), 'utf8')
    html = html.replace(match[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
  }
  html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
  // Optional web fonts fall back to the theme's local font stack while offline.
  html = html.replace(/@import\s*"https:\/\/fonts\.googleapis\.com\/[^";]*";/g, '')
  const topic = await readFile(join(root, 'samples/viewer-review-demo.loom.oui'), 'utf8')
  const hash = `oui=${deflateRawSync(topic).toString('base64url')}`
  html = html.replace('<head>', `<head><script>if(!location.hash)location.hash=${JSON.stringify(hash)};</script>`)
  html = html.replace(/<title>.*?<\/title>/, '<title>Loom Viewer · All Section Types</title>')
  await writeFile(output, html)
  console.log(`Viewer review demo: ${output} (${Buffer.byteLength(html)} bytes)`)
} finally {
  await rm(buildDir, { recursive: true, force: true })
}
