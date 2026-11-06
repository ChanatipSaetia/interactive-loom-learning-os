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
  let activePage
  const consoleErrors = []
  async function savedSource(page, app) {
    await app.getByRole('button', { name: 'Download lesson', exact: true }).click()
    const confirm = page.getByTestId('host-confirm-download')
    await confirm.waitFor({ state: 'visible', timeout: 10000 })
    const pending = page.waitForEvent('download', { timeout: 15000 })
    await confirm.click()
    const file = await pending
    assert.equal(file.suggestedFilename(), 'three-spline.loom.oui')
    assert.equal(await file.failure(), null)
    return fs.readFileSync(await file.path(), 'utf8')
  }
  try {
    for (const width of [380, 768]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } })
      activePage = page
      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
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
      activePage = page
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
  } catch (error) {
    const app = activePage?.frameLocator('#app')
    const detail = {
      error: String(error), consoleErrors,
      downloadRequested: await activePage?.evaluate(() => !!window.downloadRequested).catch(() => null),
      status: await app?.locator('[data-testid=mcp-export-status]').textContent({ timeout: 1000 }).catch(() => null),
    }
    fs.writeFileSync(path.join(out, 'download-failure.json'), JSON.stringify(detail, null, 2) + '\n')
    if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: path.join(out, 'download-failure.png') }).catch(() => {})
    console.error(JSON.stringify(detail))
    throw error
  } finally { await browser.close() }
})().catch((error) => { console.error(error); process.exitCode = 1 })
