// Run after npm run build:mcp and npm run mcp:host.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, expect } from '@playwright/test'

test('Present hides the mounted reader; inline Read grows and fullscreen Read stays bounded', async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
  try {
    for (const touch of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1153, height: 1280 }, hasTouch: touch, isMobile: touch })
      try {
        await page.goto('http://localhost:8090/?topic=http-caching&mode=read')
        const app = page.frameLocator('#app')
        await app.getByTestId('mcp-play').click({ timeout: 60000 })
        const reader = app.getByTestId('mcp-read-scroll')
        await expect(reader).toBeVisible()
        const natural = async () => {
          await expect.poll(() => reader.evaluate(el => Math.abs(el.scrollHeight - el.clientHeight))).toBeLessThan(2)
          assert.ok(await reader.evaluate(el => el.clientHeight > 640), 'Inline lesson must extend beyond the former fixed height')
        }
        await natural()
        await page.evaluate(() => window.setHostDisplayMode('fullscreen'))
        await expect(app.getByTestId('mcp-read')).toHaveClass(/mcp-full/)
        await expect.poll(() => reader.evaluate(el => el.scrollHeight - el.clientHeight)).toBeGreaterThan(100)
        const bounds = await reader.evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, viewport: innerHeight }))
        assert.ok(bounds.bottom <= bounds.viewport, 'Fullscreen reader must fit inside its frame')
        await app.getByTestId('mcp-nav-toggle').click()
        await app.getByRole('button', { name: 'Present', exact: true }).click()
        await expect(app.getByTestId('mcp-present')).toBeVisible()
        await expect(reader).toBeHidden()
        await expect.poll(() => app.locator('.mcp-stage').evaluate(el => el.clientHeight)).toBeGreaterThan(800)
        if (touch) await page.screenshot({ path: 'tests/mcp-host/results/present-fixed-1153x1280.png' })
        await page.evaluate(() => window.setHostDisplayMode('inline'))
        await app.getByTestId('mcp-ask').click()
        await expect(reader).toBeVisible()
        await natural()
        if (touch) await page.screenshot({ path: 'tests/mcp-host/results/inline-read-natural-1153x1280.png' })
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})
