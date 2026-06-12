import { test, expect } from '@playwright/test'

test.describe('Issue #11 Slice 3: Particle animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/topics/ai-agent')
  })

  test('particle circle exists in SVG', async ({ page }) => {
    const particle = page.getByTestId('flowchart-particle')
    await expect(particle).toBeInViewport()
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

  test('particle present during step-through', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const particle = page.getByTestId('flowchart-particle')

    for (let i = 0; i < 3; i++) {
      await nextBtn.click()
      await expect(particle).toBeInViewport()
      await page.waitForTimeout(500)
    }
  })
})
