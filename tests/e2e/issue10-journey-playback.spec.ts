import { test, expect } from '@playwright/test'

test.describe('Issue #10 Slice 2: Journey selector + step-by-step highlighting + playback controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/topics/ai-agent')
  })

  test('journey selector renders with all journeys', async ({ page }) => {
    const select = page.getByTestId('flowchart-journey-select')
    await expect(select).toBeVisible()

    const options = select.locator('option')
    await expect(options).toHaveCount(2)
    await expect(options.nth(0)).toHaveAttribute('value', 'query-journey')
    await expect(options.nth(0)).toHaveText('Query Journey')
    await expect(options.nth(1)).toHaveAttribute('value', 'tool-use-journey')
    await expect(options.nth(1)).toHaveText('Tool Use Journey')
    await expect(select).toHaveValue('query-journey')
  })

  test('switching journeys resets to overview', async ({ page }) => {
    const select = page.getByTestId('flowchart-journey-select')
    const progress = page.getByTestId('flowchart-progress')

    await expect(progress).toHaveText('0 / 6')

    await select.selectOption('tool-use-journey')
    await expect(progress).toHaveText('0 / 7')
  })

  test('step through all Query Journey steps with highlights', async ({ page }) => {
    const progress = page.getByTestId('flowchart-progress')
    const nextBtn = page.getByTestId('flowchart-btn-next')

    await expect(progress).toHaveText('0 / 6')
    await nextBtn.click()

    const queryJourneyNodes = [
      '[data-testid="flowchart-node-user"]',
      '[data-testid="flowchart-node-ai-agent"]',
      '[data-testid="flowchart-node-llm"]',
      '[data-testid="flowchart-node-tools-search"]',
      '[data-testid="flowchart-node-ai-agent"]',
      '[data-testid="flowchart-node-user"]',
    ]

    for (let i = 0; i < 6; i++) {
      const stepNum = i + 1
      await expect(progress).toHaveText(`${stepNum} / 6`)

      const highlighted = page.locator(`${queryJourneyNodes[i]} .flowchart-node-highlighted`)
      await expect(highlighted).toBeVisible()

      if (i < 5) {
        await nextBtn.click()
      }
    }
  })

  test('step through all Tool Use Journey steps with highlights', async ({ page }) => {
    const select = page.getByTestId('flowchart-journey-select')
    const progress = page.getByTestId('flowchart-progress')
    const nextBtn = page.getByTestId('flowchart-btn-next')

    await select.selectOption('tool-use-journey')
    await expect(progress).toHaveText('0 / 7')
    await nextBtn.click()

    const toolUseJourneyNodes = [
      '[data-testid="flowchart-node-user"]',
      '[data-testid="flowchart-node-ai-agent"]',
      '[data-testid="flowchart-node-llm"]',
      '[data-testid="flowchart-node-tools-code"]',
      '[data-testid="flowchart-node-llm"]',
      '[data-testid="flowchart-node-ai-agent"]',
      '[data-testid="flowchart-node-user"]',
    ]

    for (let i = 0; i < 7; i++) {
      const stepNum = i + 1
      await expect(progress).toHaveText(`${stepNum} / 7`)

      const highlighted = page.locator(`${toolUseJourneyNodes[i]} .flowchart-node-highlighted`)
      await expect(highlighted).toBeVisible()

      if (i < 6) {
        await nextBtn.click()
      }
    }
  })

  test('play auto-advances through journey steps', async ({ page }) => {
    const playBtn = page.getByTestId('flowchart-btn-play')
    const progress = page.getByTestId('flowchart-progress')

    await expect(progress).toHaveText('0 / 6')
    await playBtn.click()

    await expect(progress).toHaveText('1 / 6')

    for (let step = 2; step <= 6; step++) {
      await page.waitForTimeout(1300)
      await expect(progress).toHaveText(`${step} / 6`)
    }
  })

  test('pause stops auto-advance', async ({ page }) => {
    const playBtn = page.getByTestId('flowchart-btn-play')
    const pauseBtn = page.getByTestId('flowchart-btn-pause')
    const progress = page.getByTestId('flowchart-progress')

    await playBtn.click()
    await pauseBtn.click()
    await page.waitForTimeout(1500)
    await expect(progress).toHaveText('1 / 6')
  })

  test('prev button goes back one step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const prevBtn = page.getByTestId('flowchart-btn-prev')
    const progress = page.getByTestId('flowchart-progress')

    await nextBtn.click() // to 1 / 6
    await nextBtn.click() // to 2 / 6
    await expect(progress).toHaveText('2 / 6')
    await prevBtn.click()
    await expect(progress).toHaveText('1 / 6')
  })

  test('reset button returns to overview', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const resetBtn = page.getByTestId('flowchart-btn-reset')
    const progress = page.getByTestId('flowchart-progress')

    await nextBtn.click() // to 1 / 6
    await nextBtn.click() // to 2 / 6
    await nextBtn.click() // to 3 / 6
    await nextBtn.click() // to 4 / 6
    await expect(progress).toHaveText('4 / 6')
    await resetBtn.click()
    await expect(progress).toHaveText('0 / 6')
  })

  test('prev disabled at overview', async ({ page }) => {
    const prevBtn = page.getByTestId('flowchart-btn-prev')
    await expect(prevBtn).toBeDisabled()
  })

  test('next disabled at last step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    for (let i = 0; i < 6; i++) {
      await nextBtn.click()
    }
    await expect(nextBtn).toBeDisabled()
    await expect(page.getByTestId('flowchart-progress')).toHaveText('6 / 6')
  })

  test('play disabled at last step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const playBtn = page.getByTestId('flowchart-btn-play')
    for (let i = 0; i < 6; i++) {
      await nextBtn.click()
    }
    await expect(playBtn).toBeDisabled()
  })

  test('pause disabled when not playing', async ({ page }) => {
    const pauseBtn = page.getByTestId('flowchart-btn-pause')
    await expect(pauseBtn).toBeDisabled()
  })

  test('reset disabled at overview', async ({ page }) => {
    const resetBtn = page.getByTestId('flowchart-btn-reset')
    await expect(resetBtn).toBeDisabled()
  })
})
