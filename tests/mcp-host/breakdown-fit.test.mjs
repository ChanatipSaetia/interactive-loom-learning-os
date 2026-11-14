// Run with npm run dev. Uses actual browser SVG geometry, not jsdom layout.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { deflateRawSync } from 'node:zlib'
import { chromium, expect } from '@playwright/test'

const sample = await readFile('samples/token-economics.loom.oui', 'utf8')
const allocation = /\/\/ === sections\/allocation\.oui ===\n([\s\S]*?)(?=\n\/\/ ===)/.exec(sample)[1]
const source = '// @loom-topic fit-test\n// === topic.oui ===\nroot = Topic("Fit test", "Test", "", [SectionRef("allocation")])\n// === sections/allocation.oui ===\n' + allocation
const url = 'http://localhost:5173/viewer.html#oui=' + deflateRawSync(source).toString('base64url')

test('Read keeps compact readable cards, reachable horizontal scrolling and keyboard inspection at mobile, tablet and desktop widths', async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
  await mkdir('artifacts', { recursive: true })
  try {
    for (const width of [320, 768, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      try {
        await page.goto(url)
        const tree = page.getByTestId('breakdown-tree-section')
        await expect(tree).toBeVisible({ timeout: 60000 })
        const geometry = await tree.locator('.breakdown-scroll').evaluate((scroll) => {
          const svg = scroll.querySelector('svg')
          const nodes = [...scroll.querySelectorAll('foreignObject')]
          const container = scroll.getBoundingClientRect()
          const cardWidth = nodes[0].getBoundingClientRect().width
          scroll.scrollLeft = 0
          const leftEdgeReachable = Math.min(...nodes.map((node) => node.getBoundingClientRect().left)) >= container.left - 1
          scroll.scrollLeft = scroll.scrollWidth
          const rightEdgeReachable = Math.max(...nodes.map((node) => node.getBoundingClientRect().right)) <= container.right + 1
          return { overflow: scroll.scrollWidth - scroll.clientWidth, count: nodes.length, cardWidth,
            scale: svg.getBoundingClientRect().width / svg.viewBox.baseVal.width, leftEdgeReachable, rightEdgeReachable }
        })
        assert.ok(geometry.count > 10, 'Exercise a genuinely wide hierarchy')
        assert.ok(geometry.overflow > 0, 'Large trees retain horizontal exploration')
        assert.ok(Math.abs(geometry.scale - .8) < .01, 'Read scales cards down by 20%, independently of viewport width')
        assert.ok(geometry.cardWidth > 190 && geometry.cardWidth < 200, 'Cards remain readable even on narrow screens')
        assert.equal(geometry.leftEdgeReachable, true)
        assert.equal(geometry.rightEdgeReachable, true)
        const reasoner = tree.getByTestId('breakdown-node-reasoner')
        await reasoner.focus()
        await reasoner.press('Enter')
        await expect(reasoner).toHaveAttribute('aria-pressed', 'true')
        await expect(tree.locator('.breakdown-details')).toContainText('Reasoner')
        await page.screenshot({ path: `artifacts/breakdown-compact-${width}.png` })
        if (width === 1280) {
          await page.getByRole('button', { name: 'Present', exact: true }).click()
          await expect(page.getByTestId('present-controls')).toBeVisible()
          await expect(page.getByTestId('present-breakdown-tree')).toBeAttached()
          assert.equal(await page.locator('.present-breakdown .breakdown-diagram').first().evaluate((svg) => getComputedStyle(svg).getPropertyValue('--breakdown-board-scale').trim()), '', 'Read compact scale must not affect Present')
        }
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})
