import { test, expect } from '@playwright/test'

test.describe('US-5: DataFlow Section', () => {
  test('SVG renders with paths and particles', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const svg = page.getByTestId('data-flow-svg')
    await expect(svg).toBeVisible()

    const path1 = page.getByTestId('dataflow-path-cdn')
    await expect(path1).toBeVisible()

    const particle1 = page.getByTestId('dataflow-particle-cdn')
    await expect(particle1).toBeVisible()
  })

  test('animation controls respond to interaction', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const controls = page.getByTestId('data-flow-controls')
    await expect(controls).toBeVisible()

    const playBtn = page.getByTestId('dataflow-play')
    await expect(playBtn).toBeVisible()
    await playBtn.click()

    const pauseBtn = page.getByTestId('dataflow-pause')
    await expect(pauseBtn).toBeVisible()

    const stepBtn = page.getByTestId('dataflow-step')
    await expect(stepBtn).toBeVisible()

    const resetBtn = page.getByTestId('dataflow-reset')
    await expect(resetBtn).toBeVisible()
  })

  test('step button advances progress', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const stepBtn = page.getByTestId('dataflow-step')
    const progress = page.getByTestId('data-flow-progress')

    await expect(progress).toHaveText(/0 \//)

    await stepBtn.click()
    await expect(progress).toHaveText(/1 \//)

    await stepBtn.click()
    await expect(progress).toHaveText(/2 \//)
  })

  test('reset button resets progress to zero', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const stepBtn = page.getByTestId('dataflow-step')
    const resetBtn = page.getByTestId('dataflow-reset')
    const progress = page.getByTestId('data-flow-progress')

    await stepBtn.click()
    await stepBtn.click()

    await resetBtn.click()
    await expect(progress).toHaveText(/0 \//)
  })

  test('renders data flow title', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await expect(page.getByText('Data Flow Patterns')).toBeVisible()
  })
})
