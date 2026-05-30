import { test, expect } from '@playwright/test'

test.describe('US-8: Choice Section', () => {
  test('renders choice section with option cards', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const choice = page.getByTestId('choice')
    await expect(choice).toBeVisible()

    const restCard = page.getByTestId('choice-card-rest')
    await expect(restCard).toBeVisible()

    const wsCard = page.getByTestId('choice-card-websocket')
    await expect(wsCard).toBeVisible()
  })

  test('renders choice section title', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const choiceTitle = page.getByTestId('choice').getByRole('heading', { name: 'REST API vs WebSocket' })
    await expect(choiceTitle).toBeVisible()
  })

  test('clicking an option selects it', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const selectBtn = page.getByTestId('choice-select-rest')
    await selectBtn.click()

    const restCard = page.getByTestId('choice-card-rest')
    await expect(restCard).toHaveClass(/choice-card-selected/)
  })

  test('selecting one option deselects the other', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const restBtn = page.getByTestId('choice-select-rest')
    const wsBtn = page.getByTestId('choice-select-websocket')

    await restBtn.click()
    await expect(page.getByTestId('choice-card-rest')).toHaveClass(/choice-card-selected/)

    await wsBtn.click()
    await expect(page.getByTestId('choice-card-rest')).not.toHaveClass(/choice-card-selected/)
    await expect(page.getByTestId('choice-card-websocket')).toHaveClass(/choice-card-selected/)
  })

  test('selected option shows expanded details', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const selectBtn = page.getByTestId('choice-select-rest')
    await selectBtn.click()

    const details = page.getByTestId('choice-selected-details-rest')
    await expect(details).toBeVisible()
  })

  test('clicking selected option toggles it off', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const selectBtn = page.getByTestId('choice-select-rest')
    await selectBtn.click()
    await expect(page.getByTestId('choice-card-rest')).toHaveClass(/choice-card-selected/)

    await selectBtn.click()
    await expect(page.getByTestId('choice-card-rest')).not.toHaveClass(/choice-card-selected/)
  })

  test('renders pros and cons', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await expect(page.getByTestId('choice-pros-rest')).toBeVisible()
    await expect(page.getByTestId('choice-cons-rest')).toBeVisible()
    await expect(page.getByTestId('choice-pros-websocket')).toBeVisible()
    await expect(page.getByTestId('choice-cons-websocket')).toBeVisible()
  })
})
