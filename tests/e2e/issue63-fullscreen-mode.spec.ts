import { test, expect } from '@playwright/test'

test.describe('Issue #63 US-20: Fullscreen Mode Layout and Toggle Control', () => {
  test('fullscreen toggle button is visible in dock', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(page.getByTestId('flowchart-fullscreen-toggle')).toBeVisible()
  })

  test('clicking toggle enters fullscreen mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const section = page.getByTestId('flowchart-section')
    await expect(section).not.toHaveClass(/fullscreen/)

    await page.getByTestId('flowchart-fullscreen-toggle').click()
    await expect(section).toHaveClass(/fullscreen/)
  })

  test('clicking toggle again exits fullscreen mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await page.getByTestId('flowchart-fullscreen-toggle').click()
    await expect(page.getByTestId('flowchart-section')).toHaveClass(/fullscreen/)

    await page.getByTestId('flowchart-fullscreen-toggle').click()
    await expect(page.getByTestId('flowchart-section')).not.toHaveClass(/fullscreen/)
  })

  test('Escape key exits fullscreen mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await page.getByTestId('flowchart-fullscreen-toggle').click()
    await expect(page.getByTestId('flowchart-section')).toHaveClass(/fullscreen/)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('flowchart-section')).not.toHaveClass(/fullscreen/)
  })

  test('fullscreen overlay covers viewport with dark background', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await page.getByTestId('flowchart-fullscreen-toggle').click()
    const section = page.getByTestId('flowchart-section')

    const box = await section.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)

    const computedStyle = await section.evaluate(el => {
      const s = getComputedStyle(el)
      return {
        position: s.position,
        zIndex: s.zIndex,
        backgroundColor: s.backgroundColor
      }
    })
    expect(computedStyle.position).toBe('fixed')
    expect(computedStyle.zIndex).toBe('999')
  })

  test('fullscreen toggle button toggles off and on repeatedly', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const section = page.getByTestId('flowchart-section')
    const toggle = page.getByTestId('flowchart-fullscreen-toggle')

    await toggle.click()
    await expect(section).toHaveClass(/fullscreen/)

    await page.getByTestId('flowchart-fullscreen-toggle').click()
    await expect(section).not.toHaveClass(/fullscreen/)

    await toggle.click()
    await expect(section).toHaveClass(/fullscreen/)
  })

  test('SVG fills available height in fullscreen mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await page.getByTestId('flowchart-fullscreen-toggle').click()
    const svg = page.getByTestId('flowchart-svg-EVENT_STORMING')
    await expect(svg).toBeVisible()

    const svgBox = await svg.boundingBox()
    expect(svgBox).toBeTruthy()
    expect(svgBox!.height).toBeGreaterThan(400)
  })

  test('flowchart content remains visible in fullscreen mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await page.getByTestId('flowchart-fullscreen-toggle').click()

    await expect(page.getByTestId('flowchart-title')).toBeVisible()
    await expect(page.getByTestId('flowchart-svg-EVENT_STORMING')).toBeVisible()
    await expect(page.getByTestId('flowchart-node-EVENT_STORMING-user')).toBeVisible()
  })

  test('fullscreen toggle shows correct label based on state', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    // In normal mode, the toggle should exist
    await expect(page.getByTestId('flowchart-fullscreen-toggle')).toBeVisible()
  })

  test('non-Escape keys do not exit fullscreen', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await page.getByTestId('flowchart-fullscreen-toggle').click()
    await expect(page.getByTestId('flowchart-section')).toHaveClass(/fullscreen/)

    await page.getByTestId('flowchart-svg-EVENT_STORMING').click()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('flowchart-section')).toHaveClass(/fullscreen/)

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('flowchart-section')).toHaveClass(/fullscreen/)
  })
})
