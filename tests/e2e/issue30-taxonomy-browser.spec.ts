import { test, expect, type Page } from '@playwright/test'

const taxonomy = (page: Page) => page.getByTestId('taxonomy-browser-section').filter({ has: page.getByTestId('taxonomy-browser-title').filter({ hasText: 'AI Agent Capability Taxonomy' }) })

test.describe('Issue #30: TaxonomyBrowser Section', () => {
  test('renders taxonomy browser section with category cards', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const section = taxonomy(page)
    await expect(section).toBeVisible()

    const grid = taxonomy(page).getByTestId('taxonomy-browser-grid')
    await expect(grid).toBeVisible()

    const card0 = taxonomy(page).getByTestId('taxonomy-browser-card-0')
    await expect(card0).toBeVisible()

    const card1 = taxonomy(page).getByTestId('taxonomy-browser-card-1')
    await expect(card1).toBeVisible()

    const card2 = taxonomy(page).getByTestId('taxonomy-browser-card-2')
    await expect(card2).toBeVisible()

    const card3 = taxonomy(page).getByTestId('taxonomy-browser-card-3')
    await expect(card3).toBeVisible()
  })

  test('renders section title', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const title = taxonomy(page).getByTestId('taxonomy-browser-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('AI Agent Capability Taxonomy')
  })

  test('renders category card content', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await expect(taxonomy(page).getByTestId('taxonomy-browser-card-title-0')).toBeVisible()
    await expect(taxonomy(page).getByTestId('taxonomy-browser-card-title-0')).toHaveText('Hierarchical Orchestration')

    await expect(taxonomy(page).getByTestId('taxonomy-browser-subtitle-0')).toBeVisible()
    await expect(taxonomy(page).getByTestId('taxonomy-browser-subtitle-0')).toHaveText('Orchestrator-Workers')

    await expect(taxonomy(page).getByTestId('taxonomy-browser-description-0')).toBeVisible()
  })

  test('renders icons in cards', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const icons = taxonomy(page).getByTestId('taxonomy-browser-icon-0')
    await expect(icons).toBeVisible()
  })
})
