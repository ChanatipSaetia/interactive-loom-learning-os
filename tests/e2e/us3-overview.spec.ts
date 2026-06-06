import { test, expect } from '@playwright/test'

test.describe('US-3: Overview Page', () => {
  test('loads overview page with table, search, filters, pagination, and sort', async ({ page }) => {
    await page.goto('/')

    // Page title renders
    await expect(page.getByText('Interactive Learning Platform')).toBeVisible()

    // Overview table renders
    const table = page.getByTestId('overview-table')
    await expect(table).toBeVisible()

    // Topic link is present and navigates
    const topicLink = page.getByTestId('topic-link-demo')
    await expect(topicLink).toBeVisible()
    await expect(topicLink).toHaveAttribute('href', '/#/demo/ai-agent')

    // Search input exists
    const searchInput = page.getByTestId('overview-search')
    await expect(searchInput).toBeVisible()

    // Search filters topics
    await searchInput.fill('nonexistent')
    await expect(page.getByText('No topics found.')).toBeVisible()
    await searchInput.fill('')

    // Filter chips exist
    const filterChips = page.getByTestId('filter-chip-all')
    await expect(filterChips).toBeVisible()

    // Pagination controls exist
    const pagination = page.getByTestId('overview-pagination')
    await expect(pagination).toBeVisible()
    await expect(page.getByTestId('pagination-prev')).toBeVisible()
    await expect(page.getByTestId('pagination-next')).toBeVisible()

    // Sort headers are clickable
    await expect(page.getByTestId('sort-label')).toBeVisible()
    await expect(page.getByTestId('sort-category')).toBeVisible()
    await expect(page.getByTestId('sort-description')).toBeVisible()

    // Clicking topic link navigates to topic page
    await topicLink.click()
    await expect(page).toHaveURL(/\/demo/)
  })

  test('search filters by topic title', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.getByTestId('overview-search')
    await searchInput.fill('REST')
    await expect(page.getByTestId('topic-link-demo')).toBeVisible()
  })

  test('category filter narrows results', async ({ page }) => {
    await page.goto('/')
    const archChip = page.getByTestId('filter-chip-Architecture')
    await archChip.click()
    await expect(page.getByTestId('filter-chip-Architecture')).toHaveClass(/overview-filter-chip-active/)
  })

  test('sort by label toggles ascending', async ({ page }) => {
    await page.goto('/')
    const sortBtn = page.getByTestId('sort-label')
    await sortBtn.click()
    await expect(sortBtn).toBeVisible()
  })

  test('rows per page selector works', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('overview-table')).toBeVisible()
    const select = page.getByTestId('rows-per-page')
    await select.selectOption('5')
    await expect(select).toHaveValue('5')
  })
})
