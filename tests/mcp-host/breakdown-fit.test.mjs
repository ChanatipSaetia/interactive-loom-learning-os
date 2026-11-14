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

test('Read fits the entire wide tree and retains keyboard inspection at mobile, tablet and desktop widths', async () => {
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
          const bounds = scroll.getBoundingClientRect()
          const svg = scroll.querySelector('svg').getBoundingClientRect()
          const nodes = [...scroll.querySelectorAll('foreignObject')].map((node) => node.getBoundingClientRect())
          return { overflow: scroll.scrollWidth - scroll.clientWidth, svgWidth: svg.width, availableWidth: scroll.clientWidth, count: nodes.length,
            allNodesFit: nodes.every((node) => node.left >= bounds.left - 1 && node.right <= bounds.right + 1) }
        })
        assert.ok(geometry.count > 10, 'Exercise a genuinely wide hierarchy')
        assert.ok(geometry.overflow <= 1, `Read tree overflows at ${width}px`)
        assert.ok(geometry.svgWidth <= geometry.availableWidth + 1)
        assert.equal(geometry.allNodesFit, true, 'Both edge branches must remain visible')
        const reasoner = tree.getByTestId('breakdown-node-reasoner')
        await reasoner.focus()
        await reasoner.press('Enter')
        await expect(reasoner).toHaveAttribute('aria-pressed', 'true')
        await expect(tree.locator('.breakdown-details')).toContainText('Reasoner')
        await page.screenshot({ path: `artifacts/breakdown-fit-${width}.png` })
        if (width === 1280) {
          await page.getByRole('button', { name: 'Present', exact: true }).click()
          await expect(page.getByTestId('present-controls')).toBeVisible()
          await expect(page.getByTestId('present-breakdown-tree')).toBeAttached()
        }
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})
