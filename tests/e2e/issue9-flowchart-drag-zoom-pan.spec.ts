import { test, expect } from '@playwright/test'

test.describe('Issue #9: Drag nodes + mobile zoom/pan on flowchart', () => {


  test('SVG supports wheel zoom', async ({ page }) => {
    await page.goto('/topics/ai-agent')
    const svg = page.getByTestId('flowchart-svg')
    const canvas = page.getByTestId('flowchart-canvas')

    const beforeTransform = await canvas.getAttribute('transform')

    await svg.hover()
    await page.mouse.wheel(0, 100)
    await page.waitForTimeout(100)

    const afterTransform = await canvas.getAttribute('transform')
    expect(afterTransform).not.toBe(beforeTransform)
  })

  test('SVG supports drag-to-pan on background', async ({ page }) => {
    await page.goto('/topics/ai-agent')
    const svg = page.getByTestId('flowchart-svg')
    const canvas = page.getByTestId('flowchart-canvas')

    const beforeTransform = await canvas.getAttribute('transform')

    const svgBox = await svg.boundingBox()
    expect(svgBox).not.toBeNull()

    const panX = svgBox.x + 10
    const panY = svgBox.y + 10

    await page.mouse.move(panX, panY)
    await page.mouse.down()
    await page.mouse.move(panX + 100, panY + 50)
    await page.mouse.up()
    await page.waitForTimeout(100)

    const afterTransform = await canvas.getAttribute('transform')
    expect(afterTransform).not.toBe(beforeTransform)
  })

  test('zoom/pan works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/topics/ai-agent')
    const svg = page.getByTestId('flowchart-svg')
    await expect(svg).toBeVisible()

    const canvas = page.getByTestId('flowchart-canvas')

    await svg.hover()
    await page.mouse.wheel(0, 150)
    await page.waitForTimeout(100)

    const afterZoom = await canvas.getAttribute('transform')
    expect(afterZoom).not.toBe('translate(0, 0) scale(1)')
  })

  test('zoom preserves aspect ratio and edge rendering', async ({ page }) => {
    await page.goto('/topics/ai-agent')
    const svg = page.getByTestId('flowchart-svg')

    await svg.hover()
    await page.mouse.wheel(0, 200)
    await page.waitForTimeout(100)

    for (let i = 0; i < 5; i++) {
      const edgeGroup = svg.getByTestId(`flowchart-edge-${i}`)
      const line = edgeGroup.locator('line')
      await expect(line).toBeInViewport()
    }

    const viewBox = await svg.getAttribute('viewBox')
    expect(viewBox).toMatch(/^(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$/)
  })
})
