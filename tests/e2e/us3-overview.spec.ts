import { test, expect } from '@playwright/test'

test.describe('Topic catalog', () => {
  test('searches the catalog and navigates to a topic', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Interactive Learning Platform')).toBeVisible()
    const search = page.getByTestId('overview-search')
    await search.fill('nonexistent')
    await expect(page.getByText('No topics found.')).toBeVisible()
    await search.fill('AI Agent')
    const topic = page.getByTestId('topic-link-demo')
    await expect(topic).toBeVisible()
    await topic.click()
    await expect(page).toHaveURL(/\/topics\/demo/)
  })

  test('filters topics by category', async ({ page }) => {
    await page.goto('/')
    const category = page.getByTestId('category-card-Architecture')
    await category.click()
    await expect(category).toHaveClass(/active/)
    await expect(page.getByTestId('overview-table')).toBeVisible()
  })

  test('sorts and paginates in grid view', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Switch to All Topics Grid View' }).click()
    await expect(page.getByTestId('overview-pagination')).toBeVisible()
    await page.getByTestId('rows-per-page').selectOption('5')
    await expect(page.getByTestId('rows-per-page')).toHaveValue('5')
    await page.getByTestId('sort-dropdown').selectOption('label-asc')
    await expect(page.getByTestId('sort-dropdown')).toHaveValue('label-asc')
    await expect(page.getByTestId('pagination-next')).toBeEnabled()
    await page.getByTestId('pagination-next').click()
    await expect(page.getByTestId('overview-pagination')).toContainText('6–10')
  })
})
