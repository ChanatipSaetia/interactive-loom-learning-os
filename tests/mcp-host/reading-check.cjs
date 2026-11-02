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
