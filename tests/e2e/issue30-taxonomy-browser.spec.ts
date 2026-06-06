import { test, expect } from '@playwright/test'

test.describe('Issue #30: TaxonomyBrowser Section', () => {
  test('renders taxonomy browser section with category cards', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const section = page.getByTestId('taxonomy-browser-section')
    await expect(section).toBeVisible()

    const grid = page.getByTestId('taxonomy-browser-grid')
    await expect(grid).toBeVisible()

    const card0 = page.getByTestId('taxonomy-browser-card-0')
    await expect(card0).toBeVisible()

    const card1 = page.getByTestId('taxonomy-browser-card-1')
    await expect(card1).toBeVisible()

    const card2 = page.getByTestId('taxonomy-browser-card-2')
    await expect(card2).toBeVisible()

    const card3 = page.getByTestId('taxonomy-browser-card-3')
    await expect(card3).toBeVisible()
  })

  test('renders section title', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const title = page.getByTestId('taxonomy-browser-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('AI Agent Capability Taxonomy')
  })

  test('renders category card content', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await expect(page.getByTestId('taxonomy-browser-card-title-0')).toBeVisible()
    await expect(page.getByTestId('taxonomy-browser-card-title-0')).toHaveText('Reasoning & Planning')

    await expect(page.getByTestId('taxonomy-browser-subtitle-0')).toBeVisible()
    await expect(page.getByTestId('taxonomy-browser-subtitle-0')).toHaveText('Core Intelligence')

    await expect(page.getByTestId('taxonomy-browser-description-0')).toBeVisible()
  })

  test('renders icons in cards', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const icons = page.getByTestId('taxonomy-browser-icon-0')
    await expect(icons).toBeVisible()
  })
})
