import { test, expect } from '@playwright/test'

test('edge label highlights on hover and stays selected after a click', async ({ page }) => {
  await page.goto('/#/demo/ai-agent')
  const flowchart = page.getByTestId('flowchart-section').first()
  await expect(flowchart).toBeVisible({ timeout: 20000 })
  await flowchart.getByTestId('flowchart-fullscreen-toggle').click()
  const svg = flowchart.getByTestId('flowchart-svg-EVENT_STORMING')
  await expect(svg).toBeVisible({ timeout: 20000 })
  const edge = svg.locator('.flowchart-edge-group').filter({ has: page.locator('.flowchart-edge-label-pill') }).first()
  const label = edge.locator('.flowchart-edge-label-text')
  await expect(label).toBeVisible()
  await label.hover({ force: true })
  await expect(edge).toHaveAttribute('opacity', '1')
  await label.click({ force: true })
  await page.mouse.move(0, 0)
  await expect(edge).toHaveAttribute('opacity', '1')
})
