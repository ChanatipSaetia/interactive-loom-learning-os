import { test, expect } from '@playwright/test'

test.describe('Issue #10 Slice 2: Journey selector + step-by-step highlighting + playback controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
  })

  test('journey selector renders with all journeys', async ({ page }) => {
    await page.getByTestId('dock-tab-journey').click()

    const select = page.getByTestId('flowchart-journey-select')
    await expect(select).toBeVisible()

    const options = select.locator('option')
    await expect(options).toHaveCount(3)
    await expect(options.nth(0)).toHaveAttribute('value', 'agent-tool-use-loop')
    await expect(options.nth(0)).toHaveText('Agent-Subagent MCP Loop')
    await expect(options.nth(1)).toHaveAttribute('value', 'direct-llm-response')
    await expect(options.nth(1)).toHaveText('Direct LLM Response')
    await expect(options.nth(2)).toHaveAttribute('value', 'subagent-delegation')
    await expect(options.nth(2)).toHaveText('Subagent Delegation Flow')
    await expect(select).toHaveValue('agent-tool-use-loop')
  })

  test('switching journeys updates description and step counts', async ({ page }) => {
    await page.getByTestId('dock-tab-journey').click()
    const select = page.getByTestId('flowchart-journey-select')
    const description = page.getByTestId('flowchart-journey-description')
    
    await expect(description).toContainText('Follow the flow of running the agent')
    
    await select.selectOption('direct-llm-response')
    await expect(description).toContainText('Follow the fast path where the user asks a question')
    
    // Switch to steps tab to see step progress count
    await page.getByTestId('dock-tab-steps').click()
    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 3')
    
    // Verify journey title is displayed in Steps tab
    const title = page.getByTestId('flowchart-dock-journey-title')
    await expect(title).toHaveText('Direct LLM Response')
  })

  test('step through all Agent-Subagent MCP Loop steps with highlights', async ({ page }) => {
    const progress = page.getByTestId('flowchart-progress')
    const nextBtn = page.getByTestId('flowchart-btn-next')

    await expect(progress).toHaveText('0 / 4')
    await nextBtn.click()

    const queryJourneyNodes = [
      'user',
      'pol_plan',
      'pol_route',
      'pol_eval',
    ]

    for (let i = 0; i < 4; i++) {
      const stepNum = i + 1
      await expect(progress).toHaveText(`${stepNum} / 4`)

      const highlighted = page.locator(`[data-testid="flowchart-node-EVENT_STORMING-${queryJourneyNodes[i]}"] .flowchart-node-highlighted`)
      await expect(highlighted).toBeVisible()

      if (i < 3) {
        await nextBtn.click()
      }
    }
  })

  test('play auto-advances through journey steps', async ({ page }) => {
    const playBtn = page.getByTestId('flowchart-btn-play')
    const progress = page.getByTestId('flowchart-progress')

    await expect(progress).toHaveText('0 / 4')
    await playBtn.click()

    await expect(progress).toHaveText('1 / 4')

    for (let step = 2; step <= 4; step++) {
      await page.waitForTimeout(1300)
      await expect(progress).toHaveText(`${step} / 4`)
    }
  })

  test('pause stops auto-advance', async ({ page }) => {
    const playBtn = page.getByTestId('flowchart-btn-play')
    const pauseBtn = page.getByTestId('flowchart-btn-pause')
    const progress = page.getByTestId('flowchart-progress')

    await playBtn.click()
    await pauseBtn.click()
    await page.waitForTimeout(1500)
    await expect(progress).toHaveText('1 / 4')
  })

  test('prev button goes back one step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const prevBtn = page.getByTestId('flowchart-btn-prev')
    const progress = page.getByTestId('flowchart-progress')

    await nextBtn.click() // to 1 / 4
    await nextBtn.click() // to 2 / 4
    await expect(progress).toHaveText('2 / 4')
    await prevBtn.click()
    await expect(progress).toHaveText('1 / 4')
  })

  test('reset button returns to overview', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const resetBtn = page.getByTestId('flowchart-btn-reset')
    const progress = page.getByTestId('flowchart-progress')

    await nextBtn.click() // to 1 / 4
    await nextBtn.click() // to 2 / 4
    await nextBtn.click() // to 3 / 4
    await expect(progress).toHaveText('3 / 4')
    await resetBtn.click()
    await expect(progress).toHaveText('0 / 4')
  })

  test('prev disabled at overview', async ({ page }) => {
    const prevBtn = page.getByTestId('flowchart-btn-prev')
    await expect(prevBtn).toBeDisabled()
  })

  test('next disabled at last step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    for (let i = 0; i < 4; i++) {
      await nextBtn.click()
    }
    await expect(nextBtn).toBeDisabled()
    await expect(page.getByTestId('flowchart-progress')).toHaveText('4 / 4')
  })

  test('play disabled at last step', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')
    const playBtn = page.getByTestId('flowchart-btn-play')
    for (let i = 0; i < 4; i++) {
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

  test('clicking stepper card selects step and pauses playback', async ({ page }) => {
    const progress = page.getByTestId('flowchart-progress')
    const playBtn = page.getByTestId('flowchart-btn-play')
    
    // Play first
    await playBtn.click()
    await expect(progress).toHaveText('1 / 4')
    
    // Find the step card for Phase 3 (journey-step-2) and click it
    const stepCard = page.locator('[id$="journey-step-2"]')
    await expect(stepCard).toBeVisible()
    await stepCard.click()
    
    // Progress should jump to 3 / 4
    await expect(progress).toHaveText('3 / 4')
    
    // Playback should be paused (play button enabled, pause button disabled)
    await expect(playBtn).toBeEnabled()
    await expect(page.getByTestId('flowchart-btn-pause')).toBeDisabled()
    
    // Wait to verify it doesn't auto-advance (step remains at 3 / 4)
    await page.waitForTimeout(1500)
    await expect(progress).toHaveText('3 / 4')
  })
})
