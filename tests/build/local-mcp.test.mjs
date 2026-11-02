import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inlineMcpApp } from '../../scripts/inline-mcp-app.mjs'

test('embeds the player and drops Google Fonts without loading hosted assets', () => {
  const html = inlineMcpApp('window.playerReady = true', '@import url("https://fonts.googleapis.com/css2?family=Inter");body{color:red}', 'https://example.com/viewer.html')
  assert.ok(html.includes('<script type="module">window.playerReady = true</script>'))
  assert.ok(html.includes('<style>body{color:red}</style>'))
  assert.ok(html.includes('name="loom-viewer-url" content="https://example.com/viewer.html"'))
  assert.doesNotMatch(html, /fonts\.googleapis|<script[^>]+src=|<link/)
})

test('bundle strings cannot close their enclosing HTML elements', () => {
  const html = inlineMcpApp('const text = "</ScRiPt>"', 'a::after{content:"</StYlE>"}', 'https://example.com/?a="&b=<')
  assert.equal((html.match(/<\/script>/gi) ?? []).length, 1)
  assert.equal((html.match(/<\/style>/gi) ?? []).length, 1)
  assert.ok(html.includes('&quot;&amp;b=&lt;'))
})

test('unexpected CSS imports fail the build rather than creating a network dependency', () => {
  assert.throws(() => inlineMcpApp('', '@import "https://example.com/theme.css";', ''), /must not import/)
})

test('removes minified Google Fonts imports too', () => {
  assert.doesNotMatch(inlineMcpApp('', '@import"https://fonts.googleapis.com/css2?family=Inter";body{}', ''), /@import/)
})
