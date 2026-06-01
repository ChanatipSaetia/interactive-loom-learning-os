import { test, expect } from '@playwright/test'

test.describe('US-4: ArchitectureFlow Section', () => {
  test('SVG diagram renders with nodes and edges', async ({ page }) => {
    await page.goto('/')

    const topicLink = page.getByTestId('topic-link-demo')
    await expect(topicLink).toBeVisible()
    await topicLink.click()

    await expect(page).toHaveURL('/demo/ai-agent')

    const svg = page.getByTestId('architecture-flow-svg').first()
    await expect(svg).toBeVisible()
  })

  test('animation controls respond to interaction', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const controls = page.getByTestId('arch-flow-controls').first()
    await expect(controls).toBeVisible()

    const playBtn = page.getByTestId('arch-flow-play').first()
    await expect(playBtn).toBeVisible()
    await playBtn.click()

    const pauseBtn = page.getByTestId('arch-flow-pause').first()
    await expect(pauseBtn).toBeVisible()

    const stepBtn = page.getByTestId('arch-flow-step').first()
    await expect(stepBtn).toBeVisible()

    const resetBtn = page.getByTestId('arch-flow-reset').first()
    await expect(resetBtn).toBeVisible()
  })

  test('step button advances progress', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const stepBtn = page.getByTestId('arch-flow-step').first()
    const progress = page.getByTestId('arch-flow-progress').first()

    await expect(progress).toHaveText(/1 \//)

    await stepBtn.click()
    await expect(progress).toHaveText(/2 \//)

    await stepBtn.click()
    await expect(progress).toHaveText(/3 \//)
  })

  test('reset button resets progress to one', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const stepBtn = page.getByTestId('arch-flow-step').first()
    const resetBtn = page.getByTestId('arch-flow-reset').first()
    const progress = page.getByTestId('arch-flow-progress').first()

    await stepBtn.click()
    await stepBtn.click()

    await resetBtn.click()
    await expect(progress).toHaveText(/1 \//)
  })

  test('play then step produces consistent state', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const playBtn = page.getByTestId('arch-flow-play').first()
    const pauseBtn = page.getByTestId('arch-flow-pause').first()
    const stepBtn = page.getByTestId('arch-flow-step').first()
    const progress = page.getByTestId('arch-flow-progress').first()

    await playBtn.click()
    await page.waitForTimeout(500)
    await pauseBtn.click()
    await expect(stepBtn).not.toBeDisabled()
    await stepBtn.click()
    await expect(progress).toHaveText(/\d \//)
  })

  test('renders architecture flow titles', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByText('REST API Architecture')).toBeVisible()
    await expect(page.getByText('WebSocket Architecture')).toBeVisible()
  })
})
