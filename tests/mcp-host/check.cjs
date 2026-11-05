const assert = require('node:assert/strict')
// Drives the test host in Chromium and saves screenshots: the card inline, Present after Play, Read,
// the chat's light mode, and a broken topic sent back to the chat. Run `node tests/mcp-host/run.mjs`
// first.   node tests/mcp-host/check.cjs [outDir]
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const out = process.argv[2] ?? 'tests/mcp-host/results'
fs.mkdirSync(out, { recursive: true })
fs.rmSync(path.join(out, 'results.json'), { force: true })
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.png`) })
const results = {}
async function expandNavigation(app) {
  const toggle = app.locator('[data-testid=mcp-nav-toggle]')
  if (await toggle.count() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click()
}

async function open(browser, query, viewport = { width: 960, height: 720 }) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)))
  await page.goto(`http://localhost:8090/${query}`)
  const app = page.frameLocator('#app')
  await app.locator('[data-testid=mcp-card]').waitFor({ timeout: 20000 })
  await page.waitForTimeout(800)
  return { page, app, errors }
}

;(async () => {
  const browser = await chromium.launch(process.env.LOOM_CHROMIUM_PATH ? { executablePath: process.env.LOOM_CHROMIUM_PATH } : fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {})

  {
    const { page, app, errors } = await open(browser, '')
    await shot(page, 'card-dark')
    await app.locator('[data-testid=mcp-play]').click()
    await app.locator('[data-testid=mcp-present]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(4000)
    const inChat = !(await page.evaluate(() => document.body.classList.contains('fullscreen')))
    const frameHeight = await page.locator('#app').evaluate((f) => f.getBoundingClientRect().height)
    await shot(page, 'present-in-chat')
    await expandNavigation(app)
    await app.locator('[data-testid=mcp-fullscreen]').click()
    await page.waitForTimeout(1500)
    const full = await page.evaluate(() => document.body.classList.contains('fullscreen'))
    await shot(page, 'present-fullscreen')
    await expandNavigation(app)
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

  {
    // Open in Viewer: the app asks the chat to open a link that carries the topic, and Viewer plays it
    const { page, app } = await open(browser, '')
    await app.locator('[data-testid=mcp-viewer]').click()
    await page.waitForTimeout(800)
    const link = await page.evaluate(() => window.lastOpenedLink)
    // The link stays at hand to copy, in case the chat did not open it
    const shown = await app.locator('[data-testid=mcp-link] input').inputValue()
    const viewer = await browser.newPage({ viewport: { width: 960, height: 720 } })
    await viewer.goto(link)
    await viewer.locator('[data-testid=present-mode]').waitFor({ timeout: 15000 })
    await viewer.waitForTimeout(2000)
    results.viewerLink = { length: link.length, opensInPresent: true, offeredToCopy: shown === link }
    await shot(viewer, 'viewer-from-link')
  }

  {
    // Memory (slice 4): play and answer in the chat, then find it in the memory folder, reopen and summarize
    const memoryDir = path.join('tests/mcp-host/results/memory')
    const { page, app } = await open(browser, '')
    await app.locator('[data-testid=mcp-play]').click()
    await page.waitForTimeout(3000)
    await expandNavigation(app)
    await app.locator('[data-testid=mcp-close]').click()
    await app.locator('[data-testid=mcp-other-mode]').click()
    const choice = app.locator('[data-testid^=quiz-choice-0-]').first()
    await choice.scrollIntoViewIfNeeded()
    await choice.click()
    await page.waitForTimeout(1000)
    const files = fs.readdirSync(memoryDir)
    const events = files.filter((f) => f.startsWith('events-')).flatMap((f) => fs.readFileSync(path.join(memoryDir, f), 'utf8').trim().split('\n')).map((l) => JSON.parse(l))
    const reopened = await open(browser, '?open=chinese101-day1')
    const summary = await browser.newPage()
    await summary.goto('http://localhost:8090/?summary=1')
    await summary.locator('.msg.model').first().waitFor()
    await summary.waitForTimeout(500)
    results.memory = {
      topicSaved: fs.existsSync(path.join(memoryDir, 'topics/chinese101-day1.loom.oui')),
      seen: events.filter((e) => e.kind === 'seen').length,
      answered: events.filter((e) => e.kind === 'answered').map((e) => `${e.item} ${e.result}`),
      reopenedTitle: await reopened.app.locator('[data-testid=mcp-card] h1').textContent(),
      summary: (await summary.locator('.msg.model').first().textContent()).slice(0, 200),
    }
    await shot(reopened.page, 'reopened')
  }

  {
    // Save my progress (slice 6): the app hands the chat today's note and where to save it
    const { page, app } = await open(browser, '')
    await app.locator('[data-testid=mcp-other-mode]').click()
    await app.locator('[data-testid=mcp-read]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(1500)
    const choice = app.locator('[data-testid^=quiz-choice-0-]').first()
    await choice.scrollIntoViewIfNeeded()
    await choice.click()
    await page.waitForTimeout(500)
    await expandNavigation(app)
    await app.locator('[data-testid=mcp-save-progress]').click()
    await page.waitForTimeout(800)
    const message = await page.evaluate(() => window.lastMessage ?? '')
    results.saveProgress = {
      label: await app.locator('[data-testid=mcp-save-progress]').getAttribute('aria-label'),
      path: /Loom\/(?:<domain-id>|[\w-]+)\/progress\/chinese101-day1-\d{4}-\d{2}-\d{2}\.md/.exec(message)?.[0] ?? null,
      note: message.slice(message.indexOf('---'), message.indexOf('---') + 200),
    }
    await shot(page, 'save-progress')
  }

  {
    // Pick (Read): point at a quiz question, ask about it, and the question goes into the chat with the words on screen
    const { page, app } = await open(browser, '')
    await app.locator('[data-testid=mcp-play]').click()
    await app.locator('[data-testid=mcp-present]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(1500)
    await expandNavigation(app)
    await app.locator('[data-testid=mcp-ask]').click()
    await app.locator('[data-testid=mcp-read]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(1200)
    const pickOn = await app.locator('[data-testid=pick-toggle]').getAttribute('aria-pressed')
    const question = app.locator('[data-oui-file="sections/quiz.oui"][data-oui-anchor="q1"]').first()
    await question.scrollIntoViewIfNeeded()
    await question.click()
    await app.locator('[data-testid=pick-composer]').fill('Why is this the answer?')
    await app.locator('[data-testid=pick-send]').click()
    await page.waitForTimeout(800)
    const message = await page.evaluate(() => window.lastMessage ?? '')
    results.pick = { pickOnFromAsk: pickOn, message: message.slice(0, 400) }
    await shot(page, 'pick-ask')
  }

  {
    // The theme picker overrides the chat's mode for the session (decision 196)
    const { page, app } = await open(browser, '')
    const before = await app.locator('html').getAttribute('data-theme')
    await app.locator('[data-testid=mcp-theme]').first().selectOption('bedtime')
    await page.waitForTimeout(300)
    const picked = await app.locator('html').getAttribute('data-theme')
    await page.evaluate(() => window.setHostTheme('light'))
    await page.waitForTimeout(300)
    results.theme = { before, picked, afterChatChange: await app.locator('html').getAttribute('data-theme') }
    await shot(page, 'theme-picked')
  }

  {
    // A touch screen: Read starts inline; the learner explicitly requests full screen and can return.
    const context = await browser.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true })
    const page = await context.newPage()
    await page.goto('http://localhost:8090/')
    const app = page.frameLocator('#app')
    await app.locator('[data-testid=mcp-other-mode]').click()
    await app.locator('[data-testid=mcp-read]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(1000)
    const initiallyInline = !(await page.evaluate(() => document.body.classList.contains('fullscreen')))
    await expandNavigation(app)
    await app.locator('[data-testid=mcp-fullscreen]').click()
    const full = await page.evaluate(() => document.body.classList.contains('fullscreen'))
    const scroller = app.locator('[data-testid=mcp-read-scroll]')
    const scroll = await scroller.evaluate((el) => ({ canScroll: el.scrollHeight > el.clientHeight + 10 }))
    await scroller.evaluate((el) => el.scrollBy(0, 600))
    const scrolled = await scroller.evaluate((el) => el.scrollTop)
    await shot(page, 'touch-read-fullscreen')
    await page.evaluate(() => document.querySelector('#app') && window.setHostDisplayMode?.('inline'))
    await page.waitForTimeout(500)
    results.touch = { initiallyInline, fullscreen: full, ...scroll, scrolled, backToRead: await app.locator('[data-testid=mcp-read]').count() }
    await context.close()
  }

  {
    // show_library and show_domain (decision 216): the library from the local server's folder, a domain, Open and Next topic
    const page = await browser.newPage({ viewport: { width: 960, height: 900 } })
    await page.goto('http://localhost:8090/?library=1')
    const app = page.frameLocator('#app')
    await app.locator('[data-testid=viewer-library]').waitFor({ timeout: 20000 })
    const cards = await app.locator('.loom-domain-card').allInnerTexts()
    await shot(page, 'library')
    await app.locator('[data-testid=viewer-domain-chinese]').click()
    await app.locator('[data-testid=viewer-domain]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(500)
    const rows = await app.locator('.loom-topic').allInnerTexts()
    const context = await page.locator('.msg.context').allTextContents()
    await shot(page, 'domain')
    await app.locator('[data-testid=mcp-next-topic]').click()
    await page.waitForTimeout(500)
    const asked = await page.evaluate(() => window.lastMessage ?? '')
    await app.locator('[data-testid=viewer-open-topic-chinese101-day1]').click()
    await app.locator('[data-testid=mcp-card]').waitFor({ timeout: 10000 })
    results.library = {
      cards: cards.map((c) => c.replace(/\n/g, ' | ')),
      rows: rows.map((r) => r.replace(/\n/g, ' | ')),
      toldModel: context.some((t) => t.includes('looking at their Loom domain "Chinese"')),
      nextTopic: asked.slice(0, 120),
      openedTitle: await app.locator('[data-testid=mcp-card] h1').textContent(),
      backToDomain: await app.locator('[data-testid=mcp-back-to-shelf]').count(),
    }
    await shot(page, 'domain-opened')
  }

  if (process.env.LOOM_WORKER_URL) {
    // The hosted endpoint (slice 5) under `npm run worker:dev`: no validate_topic, the app from the Worker's own assets
    const { page, app, errors } = await open(browser, `?server=${encodeURIComponent(process.env.LOOM_WORKER_URL)}`)
    const tools = await page.evaluate(() => window.toolNames)
    const told = await page.locator('.msg.model').allTextContents()
    await app.locator('[data-testid=mcp-play]').click()
    await app.locator('[data-testid=mcp-present]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(3000)
    results.hosted = { tools, showTopic: told.find((t) => t.startsWith('show_topic'))?.slice(0, 120), plays: true, errors }
    await shot(page, 'hosted-present')
  }

  // Geometry comes from the production browser auditor, never jsdom/compiler guesses.
  // Prior voice/animation fixtures no longer need live pages. Release their
  // contexts before collecting independent viewport snapshots.
  for (const context of browser.contexts()) await context.close()
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  results.layout = []
  for (const width of [380, 768, 1024]) {
    for (const mode of ['present', 'read']) {
      const { page, app, errors } = await open(browser, '', { width, height: 800 })
      await app.getByRole('button', { name: mode === 'present' ? /^Present Play with narration$/ : /^Read Read at your own pace$/ }).click()
      const root = app.locator(mode === 'present' ? '[data-testid=mcp-present] .mcp-stage' : '[data-testid=mcp-read-scroll]')
      try {
        await root.waitFor({ timeout: 15000 })
      } catch (error) {
        await shot(page, 'layout-failure')
        const markers = await app.locator('[data-testid]').evaluateAll((elements) => elements.slice(0, 50).map((el) => ({ testid: el.getAttribute('data-testid'), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })))
        fs.writeFileSync(path.join(out, 'layout-failure.json'), JSON.stringify({ width, mode, errors, markers }, null, 2))
        throw error
      }
      let review
      for (let attempt = 0; attempt < 40 && !review; attempt++) {
        const value = await root.getAttribute('data-loom-layout-review')
        if (value) review = JSON.parse(value)
        else await page.waitForTimeout(250)
      }
      assert.ok(review?.measured, `Missing real layout measurement at ${width}/${mode}`)
      assert.ok(review.checkedElements > 0)
      assert.equal(review.teachingQuality, 'not-evaluated')
      results.layout.push({ width, mode, ...review })
      fs.writeFileSync(path.join(out, 'layout-review.json'), JSON.stringify({ schemaVersion: 1, kind: 'browser-geometry', snapshots: results.layout }, null, 2) + '\n')
      await shot(page, `layout-${width}-${mode}`)
      await page.close()
    }
  }
  fs.writeFileSync(path.join(out, 'layout-review.json'), JSON.stringify({ schemaVersion: 1, kind: 'browser-geometry', snapshots: results.layout }, null, 2) + '\n')
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  // Fail on broken behavior rather than treating logged observations as a passing check.
  assert.ok(!results.present.errors.some((error) => error.startsWith('pageerror:')))
  assert.equal(results.present.inChat, true)
  assert.equal(results.present.fullscreenOnRequest, true)
  assert.equal(results.present.backInChat, true)
  assert.ok(results.voice.utterances > 0)
  assert.ok(results.read.sections > 0)
  assert.equal(results.broken.errorsShown, 1)
  assert.equal(results.broken.modelToldAtOnce, true)
  assert.equal(results.broken.askedToFix, true)
  assert.equal(results.viewerLink.opensInPresent, true)
  assert.equal(results.viewerLink.offeredToCopy, true)
  assert.equal(results.memory.topicSaved, true)
  assert.ok(results.memory.seen > 0 && results.memory.answered.length > 0)
  assert.ok(results.saveProgress.path)
  assert.match(results.saveProgress.note, /loom-progress: 1/)
  assert.equal(results.pick.pickOnFromAsk, 'true')
  assert.match(results.pick.message, /Why is this the answer/)
  assert.equal(results.theme.picked, 'bedtime')
  assert.equal(results.theme.afterChatChange, 'bedtime')
  assert.equal(results.touch.initiallyInline, true)
  assert.equal(results.touch.fullscreen, true)
  assert.equal(results.touch.canScroll, true)
  assert.ok(results.touch.scrolled > 0)
  assert.equal(results.touch.backToRead, 1)
  assert.equal(results.library.toldModel, true)
  assert.ok(results.library.cards.length > 0 && results.library.rows.length > 0)
  assert.equal(results.library.backToDomain, 1)
  assert.ok(results.voice.first.some((text) => text.trim().length > 0))
  if (results.hosted) {
    assert.equal(results.hosted.plays, true)
    assert.ok(!results.hosted.tools.includes('read_learning_record'))
    assert.ok(!results.hosted.errors.some((error) => error.startsWith('pageerror:')))
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  console.log(JSON.stringify(results, null, 2))
  await browser.close()
})().catch((error) => { console.error(error); process.exit(1) })
