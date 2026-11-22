import { test, expect, type Page } from '@playwright/test'

const flowchart = (page: Page) => page.getByTestId('flowchart-section').first()

test.describe('Flowchart journey playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 })
    await flowchart(page).getByTestId('flowchart-dock-expand').click()
    await expect(flowchart(page).getByTestId('flowchart-progress')).toBeVisible()
  })

  test('switches journeys and resets their progress', async ({ page }) => {
    const select = flowchart(page).getByTestId('flowchart-journey-select')
    await expect(select.locator('option')).toHaveCount(3)
    await expect(select).toHaveValue('happy-path')
    await select.selectOption('direct-llm')
    await expect(flowchart(page).getByTestId('flowchart-journey-description')).toContainText('No tools needed')
    await expect(flowchart(page).getByTestId('flowchart-progress')).toHaveText('0 / 2')
  })

  test('steps forward, back, and resets to the overview', async ({ page }) => {
    const chart = flowchart(page)
    const progress = chart.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 6')
    await expect(chart.getByTestId('flowchart-btn-prev')).toBeDisabled()
    await chart.getByTestId('flowchart-btn-next').click()
    await chart.getByTestId('flowchart-btn-next').click()
    await expect(progress).toHaveText('2 / 6')
    await chart.getByTestId('flowchart-btn-prev').click()
    await expect(progress).toHaveText('1 / 6')
    await chart.getByTestId('flowchart-btn-reset').click()
    await expect(progress).toHaveText('0 / 6')
  })

  test('plays and pauses the journey', async ({ page }) => {
    const chart = flowchart(page)
    const toggle = chart.getByTestId('flowchart-btn-toggle')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-label', 'Pause')
    await expect(chart.getByTestId('flowchart-progress')).not.toHaveText('0 / 6')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-label', 'Play')
  })

  test('keyboard shortcuts move and reset the journey', async ({ page }) => {
    const chart = flowchart(page)
    await chart.getByTestId('flowchart-canvas-wrapper').focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(chart.getByTestId('flowchart-progress')).toHaveText('2 / 6')
    await page.keyboard.press('ArrowLeft')
    await expect(chart.getByTestId('flowchart-progress')).toHaveText('1 / 6')
    await page.keyboard.press('Home')
    await expect(chart.getByTestId('flowchart-progress')).toHaveText('0 / 6')
  })
})
