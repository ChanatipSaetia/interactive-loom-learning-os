// npm run dev first. Browser tests are outside the Worker. No external model calls.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { deflateRawSync } from 'node:zlib'
import { chromium, expect } from '@playwright/test'

const viewports = [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }, { width: 768, height: 572 }]
const source = await readFile('samples/token-economics.loom.oui', 'utf8')
const url = 'http://localhost:5173/viewer.html#oui=' + deflateRawSync(source).toString('base64url')

test('measures Read and Present independently at five viewport sizes', async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
  const results = []
  await mkdir('artifacts', { recursive: true })
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(url)
      await expect(page.getByTestId('viewer-topic')).toBeVisible({ timeout: 90000 })
      await expect(page.getByText('Loading section...', { exact: true })).toHaveCount(0, { timeout: 90000 })
      await expect(page.getByTestId('viewer-error-summary')).toHaveCount(0)
      const measure = async (mode, selector) => page.evaluate(async ({ mode, selector }) => {
        const { reviewRenderedLayout } = await import('/src/core/supporting/presentation/layout-review.ts')
        return reviewRenderedLayout(document.querySelector(selector), { viewMode: mode, maxElements: 1000, maxDiagnostics: 30 })
      }, { mode, selector })
      const read = await measure('read', '[data-testid="viewer-topic"]')
      const dock = page.getByTestId('flowchart-controls-dock')
      const reachable = await dock.evaluate((el) => {
        const canvas = el.parentElement.getBoundingClientRect()
        return [...el.querySelectorAll('button')].every((button) => {
          const b = button.getBoundingClientRect()
          return b.left >= canvas.left - 2 && b.right <= canvas.right + 2
        })
      })
      assert.equal(reachable, true, 'Flowchart playback controls must fit their canvas')
      assert.equal(read.measured, true)
      // Compact Viewer puts mode controls in More; the menu preserves the same button labels.
      if (!(await page.getByRole('button', { name: 'Present', exact: true }).isVisible())) await page.getByTestId('viewer-more').click()
      await page.getByRole('button', { name: 'Present', exact: true }).click()
      await expect(page.getByTestId('present-controls')).toBeVisible()
      if (await page.getByTestId('present-play').getAttribute('aria-label') === 'Pause autoplay') await page.getByTestId('present-play').click()
      // Exercise the long unbroken-title failure class before advancing the real lesson.
      await page.locator('.present-title-name').first().evaluate((heading) => {
        const original = heading.textContent
        heading.textContent = 'TokenEconomicsGraphExecutionContextAllocation'.repeat(4)
        const box = heading.getBoundingClientRect()
        const container = heading.parentElement.getBoundingClientRect()
        if (box.right > container.right + 2 || heading.scrollWidth > heading.clientWidth + 2) throw new Error('Technical title failed to wrap')
        heading.textContent = original
      })
      await page.getByTestId('present-next').click()
      await page.waitForTimeout(800)
      const present = await measure('present', '.present-stage')
      assert.equal(present.measured, true)
      await page.screenshot({ path: `artifacts/experience-present-${viewport.width}x${viewport.height}.png` })
      assert.deepEqual(errors, [])
      results.push({ viewport, read, present, runtimeErrors: errors })
      await page.close()
    }
  } finally {
    await writeFile('artifacts/experience-layout.json', JSON.stringify(results, null, 2) + '\n')
    await browser.close()
  }
})
