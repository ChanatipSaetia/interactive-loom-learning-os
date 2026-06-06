import { test, expect } from '@playwright/test'

test.describe('Issue #11 Slice 3: Particle animation + description panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/topics/ai-agent')
  })

  test('particle circle exists in SVG', async ({ page }) => {
    const particle = page.getByTestId('flowchart-particle')
    await expect(particle).toBeInViewport()
  })

  test('description panel appears near highlighted node', async ({ page }) => {
    const panel = page.getByTestId('flowchart-desc-panel')
    await expect(panel).toBeInViewport()
    await expect(page.getByText('User sends a query')).toBeVisible()
  })

  test('particle position changes when advancing step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const particle = page.getByTestId('flowchart-particle')

    await nextBtn.click()

    await page.waitForTimeout(100)
    const cy1 = await particle.getAttribute('cy')

    await page.waitForTimeout(200)
    const cy2 = await particle.getAttribute('cy')

    expect(cy1).not.toBe(cy2)
  })

  test('description panel text updates when step advances', async ({ page }) => {
    await expect(page.getByText('User sends a query')).toBeVisible()

    const nextBtn = page.getByTestId('flowchart-btn-next')
    await nextBtn.click()

    await expect(page.getByText('AI Agent receives the')).toBeVisible()
  })

  test('description panel repositions when step changes to different node', async ({ page }) => {
    const panel = page.getByTestId('flowchart-desc-panel')
    const rect1 = await panel.boundingBox()

    const nextBtn = page.getByTestId('flowchart-btn-next')
    for (let i = 0; i < 3; i++) {
      await nextBtn.click()
    }

    await page.waitForTimeout(100)

    const rect2 = await panel.boundingBox()

    expect(rect2!.y).not.toBe(rect1!.y)
  })

  test('particle and description present during step-through', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const particle = page.getByTestId('flowchart-particle')
    const panel = page.getByTestId('flowchart-desc-panel')

    for (let i = 0; i < 3; i++) {
      await nextBtn.click()
      await expect(particle).toBeInViewport()
      await expect(panel).toBeInViewport()
      await page.waitForTimeout(500)
    }
  })

  test('description panel not rendered without journeys', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const panel = page.getByTestId('flowchart-desc-panel')
    await expect(panel).not.toBeVisible()
  })
})
