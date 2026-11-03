// Start `npm run mcp:host` after `npm run build:mcp`, then run:
// node --test tests/mcp-host/reading-scroll.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, expect } from '@playwright/test'

test('Read scrolls natively over the intro with a wheel and a finger, inline and fullscreen', async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] }
    : {})
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 960, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
      })
      try {
        const page = await context.newPage()
        await page.goto('http://localhost:8090/')
        await page.frameLocator('#app').getByTestId('mcp-other-mode').click({ timeout: 30000 })
        const reader = page.frameLocator('#app').getByTestId('mcp-read-scroll')
        await expect(reader).toBeVisible({ timeout: 30000 })
        const cdp = mobile ? await context.newCDPSession(page) : null
        for (const mode of ['inline', 'fullscreen']) {
          await page.evaluate((mode) => window.setHostDisplayMode(mode), mode)
          await expect(page.frameLocator('#app').getByTestId('mcp-read'))
            .toHaveClass(mode === 'fullscreen' ? /mcp-full/ : /^mcp-read$/)
          await reader.evaluate((el) => {
            el.scrollTop = 0
            window.cancelledReadingGesture = false
            for (const type of ['wheel', 'touchmove']) {
              el.addEventListener(type, (event) => {
                queueMicrotask(() => { window.cancelledReadingGesture ||= event.defaultPrevented })
              }, { passive: true })
            }
          })
          const intro = page.frameLocator('#app').getByTestId('intro-section')
          await expect(intro).toBeVisible()
          const box = await reader.boundingBox()
          assert.ok(box)
          const x = box.x + box.width / 2
          const y = box.y + Math.min(260, box.height - 30)
          if (cdp) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
            for (let delta = 20; delta <= 160; delta += 20) {
              await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - delta }] })
              await page.waitForTimeout(20)
            }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          } else {
            await page.mouse.move(x, y)
            await page.mouse.wheel(0, 180)
          }
          await expect.poll(() => reader.evaluate((el) => el.scrollTop)).toBeGreaterThan(30)
          assert.equal(await reader.evaluate(() => window.cancelledReadingGesture), false,
            `${mobile ? 'touch' : 'wheel'} in ${mode} must retain the browser default`)
        }
      } finally { await context.close() }
    }
  } finally { await browser.close() }
})
