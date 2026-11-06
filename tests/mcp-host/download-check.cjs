// Real host-mediated export from the opaque sandbox, plus exact-file reopening.
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const out = process.argv[2] ?? 'tests/mcp-host/results'
fs.mkdirSync(out, { recursive: true })
const launch = process.env.LOOM_CHROMIUM_PATH ? { executablePath: process.env.LOOM_CHROMIUM_PATH } : fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}

;(async () => {
  const browser = await chromium.launch(launch)
  const checks = []
  async function savedSource(page, app) {
    const pending = page.waitForEvent('download')
    await app.getByRole('button', { name: 'Download lesson', exact: true }).click()
    const file = await pending
    assert.equal(file.suggestedFilename(), 'three-spline.loom.oui')
    assert.equal(await file.failure(), null)
    return fs.readFileSync(await file.path(), 'utf8')
  }
  try {
    for (const width of [380, 768]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } })
      const errors = []
      page.on('pageerror', (e) => errors.push(String(e)))
      await page.goto('http://localhost:8090/?fixture=three-spline')
      const app = page.frameLocator('#app')
      await app.locator('[data-testid=mcp-card]').waitFor()
      const original = await page.evaluate(() => window.shownOui)
      assert.equal(await savedSource(page, app), original)
      for (const mode of ['read', 'present']) {
        await app.getByRole('button', { name: mode === 'read' ? /^Read Read at your own pace$/ : /^Present Play with narration$/ }).click()
        const expand = app.getByRole('button', { name: 'Expand navigation', exact: true })
        if (await expand.isVisible()) await expand.click()
        const source = await savedSource(page, app)
        assert.equal(source, original, `Changed ${mode} source at ${width}px`)
        // Simulate attaching the downloaded file and asking to show it again:
        // the host calls the existing stateless tool with that exact file text.
        await page.evaluate((oui) => window.showExactTopic(oui), source)
        await app.locator('[data-testid=mcp-card]').waitFor()
        assert.equal(await savedSource(page, app), source, `Changed reopened source at ${width}px`)
      }
      assert.deepEqual(errors, [])
      checks.push({ width, cardReadPresentExport: true, exactFileReopen: true })
      await page.screenshot({ path: path.join(out, `download-${width}.png`) })
      await page.close()
    }
    for (const flag of ['no-download', 'deny-download']) {
      const page = await browser.newPage({ viewport: { width: 380, height: 800 } })
      await page.goto(`http://localhost:8090/?fixture=three-spline&${flag}=1`)
      const app = page.frameLocator('#app')
      await app.locator('[data-testid=mcp-card]').waitFor()
      await app.getByRole('button', { name: 'Download lesson', exact: true }).click()
      const status = app.locator('[data-testid=mcp-export-status]')
      await status.waitFor()
      assert.match(await status.innerText(), flag === 'no-download' ? /does not support file downloads/ : /cancelled or could not complete/)
      assert.ok(await app.getByRole('button', { name: 'Copy lesson source', exact: true }).isVisible())
      checks.push({ flag, honestFallback: true })
      await page.close()
    }
    fs.writeFileSync(path.join(out, 'download-results.json'), JSON.stringify({ checks, host: 'synthetic MCP Apps host; actual browser download; no live-client guarantee' }, null, 2) + '\n')
  } finally { await browser.close() }
})().catch((error) => { console.error(error); process.exitCode = 1 })
