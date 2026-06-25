import { test, expect } from '@playwright/test'

test.describe('Issue #11 Slice 3: Particle animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
  })

  test('particle circle exists in SVG', async ({ page }) => {
    const particle = page.getByTestId('flowchart-particle-EVENT_STORMING')
    await expect(particle).toBeAttached()
  })

  test('particle position changes when advancing step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const particle = page.getByTestId('flowchart-particle-EVENT_STORMING')

    // Go to step 0 (user)
    await nextBtn.click()
    await page.waitForTimeout(300)

    // Go to step 1 (pol_plan) which is connected to user
    await nextBtn.click()
    
    // Wait for the animation to start/run
    await page.waitForTimeout(100)
    const cx1 = await particle.getAttribute('cx')

    await page.waitForTimeout(200)
    const cx2 = await particle.getAttribute('cx')

    expect(cx1).not.toBe(cx2)
  })

  test('particle present during step-through', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const particle = page.getByTestId('flowchart-particle-EVENT_STORMING')

    for (let i = 0; i < 3; i++) {
      await nextBtn.click()
      await expect(particle).toBeAttached()
      await page.waitForTimeout(500)
    }
  })
})
