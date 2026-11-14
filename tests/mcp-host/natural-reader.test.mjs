// Run after npm run build:mcp and npm run mcp:host.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, expect } from '@playwright/test'

test('long inline Read resizes the host, reaches its last section and settles', async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage({ viewport: { width: 1153, height: 1280 }, isMobile: true, hasTouch: true })
    await page.goto('http://localhost:8090/?topic=http-caching&mode=read&natural-height')
    const app = page.frameLocator('#app')
    await app.getByTestId('mcp-play').click({ timeout: 60000 })
    const reader = app.getByTestId('mcp-read-scroll')
    await expect(reader).toBeVisible()
    // Exercise a frame taller than common mobile compositor texture limits,
    // leaving the real interactive final section at the end of the document.
    await reader.evaluate(el => {
      const content = el.querySelector('.topic-content')
      const stress = document.createElement('section')
      for (let i = 0; i < 180; i++) {
        const paragraph = document.createElement('p')
        paragraph.textContent = `Reading paragraph ${i + 1}. Long lessons must remain readable all the way to the final interactive section.`
        paragraph.style.paddingBlock = '36px'
        stress.append(paragraph)
      }
      content.insertBefore(stress, content.lastElementChild)
    })
    await expect.poll(() => page.locator('#app').evaluate(el => el.clientHeight)).toBeGreaterThan(16000)
    await expect.poll(async () => {
      const docHeight = await reader.evaluate(() => document.documentElement.scrollHeight)
      return Math.abs(await page.locator('#app').evaluate(el => el.clientHeight) - docHeight)
    }).toBeLessThan(3)
    const player = app.getByTestId('mcp-read')
    assert.deepEqual(await player.evaluate(el => ({ overflow: getComputedStyle(el).overflow, containment: getComputedStyle(el).containerType })), { overflow: 'visible', containment: 'normal' })
    const last = app.locator('.topic-content > [data-oui-file]').last()
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeInViewport()
    await last.locator('[data-testid^="quiz-choice-0-"]').first().click()
    await expect(last.locator('[data-testid^="quiz-explanation-"]').first()).toBeVisible()
    assert.equal(await reader.evaluate(el => Array.from(el.querySelectorAll('*')).some(node => getComputedStyle(node).backdropFilter !== 'none')), false)
    // Font loading and section mounting may each resize once; a settled page must
    // not keep exchanging sizes with the host or rerunning viewport diagnostics.
    await page.waitForTimeout(1500)
    const count = await page.evaluate(() => window.hostSizeChanges.length)
    await page.waitForTimeout(1500)
    assert.equal(await page.evaluate(() => window.hostSizeChanges.length), count)
    assert.equal(await reader.getAttribute('data-loom-layout-review'), null)
    await page.screenshot({ path: 'tests/mcp-host/results/inline-read-bottom-1153x1280.png' })
    console.log('frame height:', await page.locator('#app').evaluate(el => el.clientHeight), 'size notifications:', count)
  } finally { await browser.close() }
})
