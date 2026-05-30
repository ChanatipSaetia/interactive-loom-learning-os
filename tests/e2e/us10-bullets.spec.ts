import { test, expect } from '@playwright/test'

test.describe('US-10: Bullets Section', () => {
  test('renders bullets section with list items', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const bulletsSection = page.getByTestId('bullets-section')
    await expect(bulletsSection).toBeVisible()

    const firstItem = page.getByTestId('bullet-text-0')
    await expect(firstItem).toBeVisible()
    await expect(firstItem).toHaveText('GET — Retrieve a resource')
  })

  test('renders section title', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await expect(page.getByTestId('bullets-title')).toBeVisible()
    await expect(page.getByTestId('bullets-title')).toHaveText('HTTP Methods')
  })

  test('renders all bullet text items', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await expect(page.getByTestId('bullet-text-0')).toBeVisible()
    await expect(page.getByTestId('bullet-text-1')).toBeVisible()
    await expect(page.getByTestId('bullet-text-2')).toBeVisible()
    await expect(page.getByTestId('bullet-text-3')).toBeVisible()
  })

  test('renders bullet markers', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const markers = page.getByTestId('bullet-marker-0')
    await expect(markers).toBeVisible()
  })

  test('checkable items toggle checked state', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const checkbox = page.getByTestId('bullet-checkbox-0')
    await expect(checkbox).toBeVisible()

    await checkbox.click()
    await expect(page.getByTestId('bullet-icon-checked-0')).toBeVisible()
    await expect(page.getByTestId('bullet-text-0')).toHaveClass(/bullet-text-checked/)

    await checkbox.click()
    await expect(page.getByTestId('bullet-icon-unchecked-0')).toBeVisible()
  })
})
