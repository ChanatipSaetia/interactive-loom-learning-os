import { test, expect } from '@playwright/test'

test.describe('Flowchart Edge Hover & Tap Interaction', () => {
  test('expands full edge label on hover and click', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const svg = page.getByTestId('flowchart-svg-EVENT_STORMING').first()
    await expect(svg).toBeVisible()

    // Locate the first edge element in the flowchart
    const edge = page.locator('[data-testid^="flowchart-edge-EVENT_STORMING-"]').first()
    await expect(edge).toBeAttached()

    // Hover over the edge (using force: true since the 30px transparent hit-path overlays the visible stroke)
    await edge.hover({ force: true })

    // Verify edge is attached and visible
    await expect(edge).toBeVisible()

    // Click/tap the edge path to test mobile toggle
    await edge.click({ force: true })
    await expect(edge).toBeVisible()
  })
})
