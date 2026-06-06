import { test, expect } from '@playwright/test'

test.describe('Issue #32: TaxonomyBrowser Animations + E2E', () => {
  test('grid renders cards -> click card -> modal opens with correct content -> close -> grid still visible', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    // Grid renders with cards
    const grid = page.getByTestId('taxonomy-browser-grid')
    await expect(grid).toBeVisible()

    for (let i = 0; i < 4; i++) {
      const card = page.getByTestId(`taxonomy-browser-card-${i}`)
      await expect(card).toBeVisible()
    }

    // Click card opens modal with correct content
    await page.getByTestId('taxonomy-browser-card-0').click()

    const dialog = page.getByTestId('taxonomy-dialog')
    await expect(dialog).toBeVisible()

    const modalTitle = dialog.locator('.taxonomy-modal-title')
    await expect(modalTitle).toHaveText('Reasoning & Planning')

    const inScope = dialog.getByTestId('taxonomy-modal-in-scope')
    await expect(inScope).toBeVisible()

    const outOfScope = dialog.getByTestId('taxonomy-modal-out-of-scope')
    await expect(outOfScope).toBeVisible()

    // Close modal
    await page.getByTestId('taxonomy-dialog-close').click()
    await expect(dialog).not.toBeVisible()

    // Grid still visible after closing
    await expect(grid).toBeVisible()
    for (let i = 0; i < 4; i++) {
      const card = page.getByTestId(`taxonomy-browser-card-${i}`)
      await expect(card).toBeVisible()
    }
  })
})
