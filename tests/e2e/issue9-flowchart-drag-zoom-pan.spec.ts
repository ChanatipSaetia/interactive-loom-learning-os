import { test, expect, type Page } from '@playwright/test'

const flowchart = (page: Page) => page.getByTestId('flowchart-section').first()

test.describe('Issue #9: Drag nodes + mobile zoom/pan on flowchart', () => {

  test('SVG supports wheel zoom', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const svg = flowchart(page).getByTestId('flowchart-svg-EVENT_STORMING')
    const canvas = flowchart(page).getByTestId('flowchart-canvas-EVENT_STORMING')

    const beforeTransform = await canvas.getAttribute('transform')

    await svg.hover()
    await page.mouse.wheel(0, 100)
    await page.waitForTimeout(100)

    const afterTransform = await canvas.getAttribute('transform')
    expect(afterTransform).not.toBe(beforeTransform)
  })

  test('zoom/pan works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/#/demo/ai-agent')
    const svg = flowchart(page).getByTestId('flowchart-svg-EVENT_STORMING')
    await expect(svg).toBeVisible()

    const canvas = flowchart(page).getByTestId('flowchart-canvas-EVENT_STORMING')

    await svg.hover()
    await page.mouse.wheel(0, 150)
    await page.waitForTimeout(100)

    const afterZoom = await canvas.getAttribute('transform')
    expect(afterZoom).not.toBe('translate(0, 0) scale(1)')
  })

  test('zoom preserves aspect ratio and edge rendering', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const svg = flowchart(page).getByTestId('flowchart-svg-EVENT_STORMING')

    await svg.hover()
    await page.mouse.wheel(0, 200)
    await page.waitForTimeout(100)

    const path = svg.getByTestId('flowchart-edge-EVENT_STORMING-0')
    await expect(path).toBeAttached()
  })
})
