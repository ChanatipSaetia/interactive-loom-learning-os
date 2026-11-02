// Run after npm run build:mcp and npm run mcp:host.
const { chromium } = require('playwright')
const fs = require('node:fs')

;(async () => {
  const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {})
  for (const [name, width, touch] of [['reading-mobile', 390, true], ['reading-desktop', 1000, false]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch })
    const errors = []
    page.on('pageerror', (error) => errors.push(String(error)))
    await page.goto('http://localhost:8090/?topic=http-caching&mode=read')
    await page.evaluate(() => {
      const meta = document.createElement('meta')
      meta.name = 'viewport'; meta.content = 'width=device-width,initial-scale=1'
      document.head.append(meta)
    })
    const app = page.frameLocator('#app')
    await app.locator('[data-testid=mcp-play]').click({ timeout: 30000 })
    await app.locator('[data-testid=mcp-read]').waitFor()
    if (await page.evaluate(() => document.body.classList.contains('fullscreen'))) throw Error('Read requested fullscreen automatically')
    if (await app.locator('[data-testid=mcp-read-pages]').count()) throw Error('Pagination still rendered')
    const scroll = app.locator('[data-testid=mcp-read-scroll]')
    const dimensions = await scroll.evaluate((el) => ({ height: el.clientHeight, content: el.scrollHeight }))
    if (dimensions.content <= dimensions.height) throw Error('Full reading content did not load')
    // Mimic a host cancelling native nested scrolling; delivered gestures still move the reader.
    await app.locator('body').evaluate(() => {
      window.addEventListener('wheel', (event) => event.preventDefault(), { capture: true, passive: false })
      window.addEventListener('touchmove', (event) => event.preventDefault(), { capture: true, passive: false })
    })
    const box = await scroll.boundingBox()
    const x = box.x + box.width * .7, y = box.y + Math.min(250, box.height * .5)
    if (!touch) {
      await page.mouse.move(x, y)
      await page.mouse.wheel(0, 250)
    } else {
      const input = await page.context().newCDPSession(page)
      await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y + 80 }] })
      for (let n = 1; n <= 6; n++) {
        await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 80 - n * 25 }] })
        await page.waitForTimeout(20)
      }
      await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    await page.waitForTimeout(200)
    if (await scroll.evaluate((el) => el.scrollTop) <= 0) throw Error('Wheel or touch input did not scroll')
    await scroll.evaluate((el) => { el.scrollTop = 300 })
    if (await scroll.evaluate((el) => el.scrollTop) <= 0) throw Error('Reading does not scroll')
    const choice = app.locator('[data-testid^=quiz-choice-0-]').first()
    await choice.scrollIntoViewIfNeeded()
    await choice.click()
    const answer = await app.locator('[data-testid^=quiz-explanation-]').first().innerText()
    await page.evaluate(() => window.setHostDisplayMode('fullscreen'))
    await page.evaluate(() => window.setHostDisplayMode('inline'))
    await app.locator('[data-testid=mcp-read]').waitFor()
    if (await app.locator('[data-testid^=quiz-explanation-]').first().innerText() !== answer) throw Error('Answer lost on display mode change')
    await scroll.evaluate((el) => { el.scrollTop = 0 })
    await page.locator('#app').screenshot({ path: `tests/mcp-host/results/${name}.png` })
    if (errors.length) throw Error(errors.join('\n'))
    console.log(name, 'continuous scrolling, inline entry and answer retention passed', dimensions)
    await page.close()
  }
  await browser.close()
})().catch((error) => { console.error(error); process.exit(1) })
