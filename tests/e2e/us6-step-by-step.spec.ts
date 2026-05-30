import { test, expect } from '@playwright/test'

test.describe('US-6: StepByStep Section', () => {
  test('renders step content with title and body', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const stepByStep = page.getByTestId('step-by-step')
    await expect(stepByStep).toBeVisible()

    const stepTitle = page.getByTestId('step-title')
    await expect(stepTitle).toBeVisible()
    await expect(stepTitle).toHaveText('Step 1: Client Sends Request')

    const stepBody = page.getByTestId('step-body')
    await expect(stepBody).toBeVisible()
  })

  test('renders step-by-step section title', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await expect(page.getByText('REST Lifecycle')).toBeVisible()
  })

  test('Next button advances step content', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const progress = page.getByTestId('step-progress')
    await expect(progress).toHaveText('1 / 4')

    const nextBtn = page.getByTestId('step-next')
    await nextBtn.click()
    await expect(progress).toHaveText('2 / 4')
    await expect(page.getByTestId('step-title')).toHaveText('Step 2: Server Processes Request')

    await nextBtn.click()
    await expect(progress).toHaveText('3 / 4')
    await expect(page.getByTestId('step-title')).toHaveText('Step 3: Server Returns Response')
  })

  test('Prev button retreats step content', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const nextBtn = page.getByTestId('step-next')
    const prevBtn = page.getByTestId('step-prev')
    const progress = page.getByTestId('step-progress')

    await nextBtn.click()
    await expect(progress).toHaveText('2 / 4')

    await prevBtn.click()
    await expect(progress).toHaveText('1 / 4')
    await expect(page.getByTestId('step-title')).toHaveText('Step 1: Client Sends Request')
  })

  test('Prev button is disabled at first step', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const prevBtn = page.getByTestId('step-prev')
    await expect(prevBtn).toBeDisabled()
  })

  test('Next button is disabled at last step', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const nextBtn = page.getByTestId('step-next')

    await nextBtn.click()
    await nextBtn.click()
    await nextBtn.click()

    await expect(nextBtn).toBeDisabled()
  })
})
