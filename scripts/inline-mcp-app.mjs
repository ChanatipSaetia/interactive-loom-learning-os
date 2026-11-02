/** Build a standalone MCP resource from the browser bundle, without external fonts. */
export function inlineMcpApp(js, css, viewerUrl) {
  const styles = css.replace(/@import\s*(?:url\(\s*)?['"]https:\/\/fonts\.googleapis\.com\/[^'"]*['"]\s*\)?\s*;/gi, '')
  if (/@import\b/i.test(styles)) throw new Error('The local MCP stylesheet must not import external resources')
  const escapeAttribute = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="loom-viewer-url" content="${escapeAttribute(viewerUrl)}">
<title>Loom</title><style>${styles.replace(/<\/style/gi, '<\\/style')}</style></head>
<body><div id="root"></div><script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`
}
