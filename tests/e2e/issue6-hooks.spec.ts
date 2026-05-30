import { test, expect } from '@playwright/test'

test.describe('Issue #6: Extracted hooks maintain Overview behavior', () => {
  test('overview page renders and all interactions work with hooks', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Interactive Learning Platform')).toBeVisible()
    await expect(page.getByTestId('overview-table')).toBeVisible()
    await expect(page.getByTestId('overview-pagination')).toBeVisible()

    // Search works (useTopicFiltering)
    const searchInput = page.getByTestId('overview-search')
    await searchInput.fill('nonexistent')
    await expect(page.getByText('No topics found.')).toBeVisible()
    await searchInput.fill('')
    await expect(page.getByTestId('topic-link-demo')).toBeVisible()

    // Sort works (useTopicFiltering)
    await page.getByTestId('sort-label').click()
    await expect(page.getByTestId('sort-label')).toBeVisible()

    // Pagination works (usePagination)
    await expect(page.getByTestId('pagination-prev')).toBeVisible()
    await expect(page.getByTestId('pagination-next')).toBeVisible()
    const select = page.getByTestId('rows-per-page')
    await select.selectOption('5')
    await expect(select).toHaveValue('5')
  })
})
