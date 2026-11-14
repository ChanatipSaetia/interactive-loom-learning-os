// Run with npm run dev. Check compact Read controls without shrinking text or hit areas.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { deflateRawSync } from 'node:zlib'
import { chromium, expect } from '@playwright/test'

const sample = await readFile('samples/token-economics.loom.oui', 'utf8')
const section = /\/\/ === sections\/sensitivity\.oui ===\n([\s\S]*?)(?=\n\/\/ ===)/.exec(sample)[1]
const source = '// @loom-topic spacing-test\n// === topic.oui ===\nroot = Topic("Formula spacing", "Test", "", [SectionRef("sensitivity")])\n// === sections/sensitivity.oui ===\n' + section
const url = 'http://localhost:5173/viewer.html#oui=' + deflateRawSync(source).toString('base64url')

test('Formula Read panels use compact spacing and retain keyboard slider interaction', async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
  await mkdir('artifacts', { recursive: true })
  try {
    for (const width of [390, 768, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      try {
        await page.goto(url)
        const sandbox = page.getByTestId('formula-sandbox-section')
        await expect(sandbox).toBeVisible({ timeout: 60000 })
        const layout = await sandbox.evaluate((root) => {
          const panel = getComputedStyle(root.querySelector('.controls-panel'))
          const metrics = getComputedStyle(root.querySelector('.sandbox-metrics'))
          const group = getComputedStyle(root.querySelector('.slider-group'))
          const header = getComputedStyle(root.querySelector('.slider-header'))
          return { padding: parseFloat(panel.paddingTop), gap: parseFloat(panel.gap), metricPadding: parseFloat(metrics.paddingTop), groupGap: parseFloat(group.gap), font: parseFloat(header.fontSize), sliderHeight: root.querySelector('input[type=range]').getBoundingClientRect().height }
        })
        assert.equal(layout.padding, 12)
        assert.equal(layout.gap, 12)
        assert.equal(layout.metricPadding, 12)
        assert.equal(layout.groupGap, 4)
        assert.ok(layout.font >= 13, 'Text keeps its reading size')
        assert.ok(layout.sliderHeight >= 24, 'The theme slider hit area remains intact')
        const slider = sandbox.getByRole('slider', { name: 'fresh_input_tokens', exact: true })
        await expect(slider).toHaveValue('15000')
        await slider.focus()
        await slider.press('ArrowRight')
        await expect(slider).toHaveValue('15100')
        await expect(sandbox.locator('.slider-value').first()).toHaveText('15100')
        await page.screenshot({ path: `artifacts/formula-compact-${width}.png` })
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})
