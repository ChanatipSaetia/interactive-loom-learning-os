// Drives the test host in Chromium and saves screenshots: the card inline, Present after Play, Read,
// the chat's light mode, and a broken topic sent back to the chat. Run `node tests/mcp-host/run.mjs`
// first.   node tests/mcp-host/check.cjs [outDir]
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const out = process.argv[2] ?? 'tests/mcp-host/results'
fs.mkdirSync(out, { recursive: true })
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.png`) })
const results = {}

async function open(browser, query) {
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
  await page.goto(`http://localhost:8090/${query}`)
  const app = page.frameLocator('#app')
  await app.locator('[data-testid=mcp-card]').waitFor({ timeout: 20000 })
  await page.waitForTimeout(800)
  return { page, app, errors }
}

;(async () => {
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {})

  {
    const { page, app, errors } = await open(browser, '')
    await shot(page, 'card-dark')
    await app.locator('[data-testid=mcp-play]').click()
    await app.locator('[data-testid=mcp-present]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(4000)
    const inChat = !(await page.evaluate(() => document.body.classList.contains('fullscreen')))
    const frameHeight = await page.locator('#app').evaluate((f) => f.getBoundingClientRect().height)
    await shot(page, 'present-in-chat')
    await app.locator('[data-testid=mcp-fullscreen]').click()
    await page.waitForTimeout(1500)
    const full = await page.evaluate(() => document.body.classList.contains('fullscreen'))
    await shot(page, 'present-fullscreen')
    await app.locator('[data-testid=mcp-fullscreen]').click()
    await page.waitForTimeout(800)
    const backInChat = !(await page.evaluate(() => document.body.classList.contains('fullscreen')))
    results.present = { inChat, frameHeight: Math.round(frameHeight), fullscreenOnRequest: full, backInChat, errors }
  }
  {
    // Headless Chromium has no speech voices: give every frame a stand-in voice that records what it is asked to say
    const context = await browser.newContext({ viewport: { width: 960, height: 720 } })
    await context.addInitScript(() => {
      const spoken = []
      const voice = { name: 'Test voice', lang: 'en-US', default: true, localService: true, voiceURI: 'test' }
      const synth = {
        speaking: false, pending: false, paused: false, onvoiceschanged: null,
        getVoices: () => [voice],
        speak(u) { spoken.push(u.text); setTimeout(() => { u.onstart?.({}); u.onend?.({}) }, 300) },
        cancel() {}, pause() {}, resume() {},
        addEventListener() {}, removeEventListener() {},
      }
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
      window.__spoken = spoken
    })
    const page = await context.newPage()
    await page.goto('http://localhost:8090/')
    const app = page.frameLocator('#app')
    await app.locator('[data-testid=mcp-play]').click()
    await app.locator('[data-testid=mcp-present]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(6000)
    const frame = page.frames().find((f) => f !== page.mainFrame())
    const spoken = await frame.evaluate(() => window.__spoken)
    results.voice = { utterances: spoken.length, first: spoken.slice(0, 3).map((t) => t.slice(0, 80)) }
    await shot(page, 'present-voice')
    await context.close()
  }
  {
    const { page, app } = await open(browser, '?theme=light')
    await shot(page, 'card-light')
    await app.locator('[data-testid=mcp-other-mode]').click()
    await app.locator('[data-testid=mcp-read]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(1500)
    results.read = { sections: await app.locator('.topic-content > *').count() }
    await shot(page, 'read-light')
  }
  {
    const { page, app } = await open(browser, '?broken=1')
    const context = await page.locator('.msg.context').allTextContents()
    await app.locator('[data-testid=mcp-ask-fix]').click()
    await page.waitForTimeout(500)
    const fromApp = await page.locator('.msg.user').allTextContents()
    results.broken = {
      errorsShown: await app.locator('[data-testid=mcp-errors]').count(),
      modelToldAtOnce: context.some((t) => t.includes('found these errors')),
      askedToFix: fromApp.some((t) => t.includes('(from the app)') && t.includes('errors')),
    }
    await shot(page, 'broken')
  }

  console.log(JSON.stringify(results, null, 2))
  await browser.close()
})()
