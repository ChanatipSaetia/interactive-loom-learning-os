// Drives the test host in Chromium: loads the topic, presses Play, and saves screenshots plus the
// app's result table. Run after `node server.mjs --http` and `node serve.mjs`.
//   node check.cjs [outDir]
const { chromium } = require('playwright')
const path = require('node:path')

const out = process.argv[2] ?? '.'

async function run(page, query, name) {
  const logs = []
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`))
  await page.goto(`http://localhost:8090/${query}`)
  const frame = page.frameLocator('#app')
  try {
    await frame.locator('button#play').waitFor({ timeout: 8000 })
  } catch {
    await page.screenshot({ path: path.join(out, `${name}-inline.png`) })
    return { loaded: false, logs: logs.filter((l) => /Content Security|Refused|blocked/i.test(l)) }
  }
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(out, `${name}-inline.png`) })
  await frame.locator('button#play').click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, `${name}-after-play.png`) })
  const rows = await frame.locator('tr').allTextContents()
  return { loaded: true, rows }
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
  console.log('with declared origin:', JSON.stringify(await run(page, '', 'declared'), null, 2))
  const page2 = await browser.newPage({ viewport: { width: 900, height: 700 } })
  console.log('origin not declared:', JSON.stringify(await run(page2, '?drop-domains=1', 'undeclared'), null, 2))
  await browser.close()
})()
