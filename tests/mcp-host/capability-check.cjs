// Real browser Read/Present checks for the authored #198 fixture. No semantic judging.
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const out = process.argv[2] ?? 'tests/mcp-host/results'
fs.mkdirSync(out, { recursive: true })
const launch = process.env.LOOM_CHROMIUM_PATH ? { executablePath: process.env.LOOM_CHROMIUM_PATH } : fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}

;(async () => {
  const browser = await chromium.launch(launch)
  const snapshots = []
  try {
    for (const width of [380, 768]) for (const mode of ['read', 'present']) {
      const page = await browser.newPage({ viewport: { width, height: 800 } })
      const errors = []
      page.on('pageerror', (error) => errors.push(String(error)))
      await page.goto('http://localhost:8090/?fixture=three-spline')
      const app = page.frameLocator('#app')
      await app.locator('[data-testid=mcp-card]').waitFor({ timeout: 20000 })
      await app.getByRole('button', { name: mode === 'present' ? /^Present Play with narration$/ : /^Read Read at your own pace$/ }).click()
      const root = app.locator(mode === 'present' ? '[data-testid=mcp-present] .mcp-stage' : '[data-testid=mcp-read-scroll]')
      await root.waitFor({ timeout: 15000 })
      const sectionIds = await page.evaluate(() => window.fixtureSectionIds)
      assert.ok(Array.isArray(sectionIds) && sectionIds.length > 0)
      if (mode === 'read') {
        for (const id of sectionIds) {
          const section = app.locator(`[data-oui-file="sections/${id}.oui"]`).first()
          await section.scrollIntoViewIfNeeded()
          assert.ok(await section.isVisible(), `Missing Read section ${id}/${width}`)
          if (id === 'spatial') {
            for (const target of ['inside', 'outside']) assert.ok(await section.locator(`[data-svg-id="${target}"]`).isVisible(), `Missing Read SVG target ${target}/${width}`)
          }
        }
        const answer = app.locator('[data-testid^=quiz-choice-]').first()
        await answer.scrollIntoViewIfNeeded()
        await answer.click()
      } else {
        // Visit every selected representation, beyond the title-only opening.
        const showControls = app.locator('[data-testid=present-show-controls]')
        if (await showControls.isVisible()) await showControls.click()
        const narration = app.locator('[data-testid=present-narration]')
        if (await narration.isEnabled() && await narration.getAttribute('aria-pressed') === 'true') await narration.click()
        const play = app.locator('[data-testid=present-play]')
        if (await play.getAttribute('aria-label') === 'Pause autoplay') await play.click()
        for (let section = 1; section <= sectionIds.length; section++) {
          await app.getByRole('button', { name: new RegExp(`^Go to section ${section}:`) }).click()
          await app.locator('[data-testid=present-next]').click()
          if (sectionIds[section - 1] === 'spatial') {
            // Next first finishes an entrance in progress. Observe the rail's
            // active beat instead of assuming two quick clicks advanced twice.
            const diagramBeat = app.getByRole('button', { name: new RegExp(`^Go to section ${section}:`) }).locator('.present-tick').nth(2)
            for (let attempt = 0; attempt < 6 && !/\bis-now\b/.test(await diagramBeat.getAttribute('class') ?? ''); attempt++) {
              await app.locator('[data-testid=present-next]').click()
              await page.waitForTimeout(150)
            }
            assert.match(await diagramBeat.getAttribute('class') ?? '', /\bis-now\b/, 'Did not reach the diagram beat')
            for (const target of ['inside', 'outside']) await root.locator(`[data-svg-id="${target}"]`).waitFor({ state: 'visible', timeout: 5000 })
          }
          await page.waitForTimeout(500)
          assert.ok(await root.isVisible(), `Missing Present stage ${section}/${width}`)
        }
      }
      // The production auditor supplies measured geometry, with bounded warnings.
      await page.waitForTimeout(1000)
      const review = JSON.parse(await root.getAttribute('data-loom-layout-review') ?? 'null')
      assert.ok(review?.measured && review.checkedElements > 0, `No geometry ${width}/${mode}`)
      assert.equal(review.teachingQuality, 'not-evaluated')
      assert.deepEqual(errors, [])
      snapshots.push({ width, mode, ...review })
      await page.screenshot({ path: path.join(out, `capability-${width}-${mode}.png`) })
      fs.writeFileSync(path.join(out, 'capability-layout.json'), JSON.stringify({ kind: 'authored-fixture-browser', snapshots }, null, 2) + '\n')
      await page.close()
    }
  } finally { await browser.close() }
})().catch((error) => { console.error(error); process.exitCode = 1 })
