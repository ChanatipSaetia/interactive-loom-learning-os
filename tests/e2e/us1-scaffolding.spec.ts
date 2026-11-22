import { test, expect } from '@playwright/test'

test('navigation shell returns from a topic to the catalog', async ({ page }) => {
  await page.goto('/#/demo/ai-agent')
  await expect(page).toHaveTitle('Interactive Loom Learning OS')
  const header = page.locator('.topnav')
  await expect(header).toBeVisible()
  await expect(header.getByRole('link', { name: /Gamification Campaign/ })).toBeVisible()
  await header.getByRole('link', { name: /Learning OS/ }).click()
  await expect(page.getByText('Interactive Learning Platform')).toBeVisible()
  await expect(page.getByTestId('overview-search')).toBeVisible()
})
