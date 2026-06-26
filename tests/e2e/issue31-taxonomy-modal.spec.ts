import { test, expect } from '@playwright/test'

test.describe('Issue #31: TaxonomyBrowser Detail Modal', () => {
  test('clicking a card opens detail modal', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const card = page.getByTestId('taxonomy-browser-card-0')
    await card.click()

    const dialog = page.getByTestId('taxonomy-dialog')
    await expect(dialog).toBeVisible()

    const overlay = page.getByTestId('taxonomy-overlay')
    await expect(overlay).toBeVisible()
  })

 test('modal shows correct category data', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await page.getByTestId('taxonomy-browser-card-0').click()

    const dialog = page.getByTestId('taxonomy-dialog')
    await expect(dialog).toBeVisible()

    const modalTitle = dialog.locator('.taxonomy-modal-title')
    await expect(modalTitle).toBeVisible()
    await expect(modalTitle).toHaveText('Hierarchical Orchestration')

    const modalSubtitle = dialog.locator('.taxonomy-modal-subtitle')
    await expect(modalSubtitle).toBeVisible()
    await expect(modalSubtitle).toHaveText('Orchestrator-Workers')

    const overview = dialog.getByTestId('taxonomy-modal-overview')
    await expect(overview).toBeVisible()

    const deepdive = dialog.getByTestId('taxonomy-modal-deepdive')
    await expect(deepdive).toBeVisible()

    const scope = dialog.getByTestId('taxonomy-modal-scope')
    await expect(scope).toBeVisible()
  })

  test('modal closes on close button click', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await page.getByTestId('taxonomy-browser-card-0').click()
    await expect(page.getByTestId('taxonomy-dialog')).toBeVisible()

    await page.getByTestId('taxonomy-dialog-close').click()
    await expect(page.getByTestId('taxonomy-dialog')).not.toBeVisible()
  })

  test('modal closes on Escape key', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await page.getByTestId('taxonomy-browser-card-0').click()
    await expect(page.getByTestId('taxonomy-dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('taxonomy-dialog')).not.toBeVisible()
  })

  test('modal shows second category when clicked', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await page.getByTestId('taxonomy-browser-card-1').click()

    const dialog = page.getByTestId('taxonomy-dialog')
    await expect(dialog).toBeVisible()
    const modalTitle = dialog.locator('.taxonomy-modal-title')
    await expect(modalTitle).toBeVisible()
    await expect(modalTitle).toHaveText('Sequential Choreography')
    const modalSubtitle = dialog.locator('.taxonomy-modal-subtitle')
    await expect(modalSubtitle).toBeVisible()
    await expect(modalSubtitle).toHaveText('Chain of Agents')
  })

  test('modal shows in-scope and out-of-scope lists', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await page.getByTestId('taxonomy-browser-card-0').click()

    const dialog = page.getByTestId('taxonomy-dialog')
    await expect(dialog).toBeVisible()

    const inScope = dialog.getByTestId('taxonomy-modal-in-scope')
    await expect(inScope).toBeVisible()
    await expect(dialog.getByTestId('taxonomy-modal-in-scope-0')).toContainText('Central director')

    const outOfScope = dialog.getByTestId('taxonomy-modal-out-of-scope')
    await expect(outOfScope).toBeVisible()
    await expect(dialog.getByTestId('taxonomy-modal-out-of-scope-0')).toContainText('Peer-to-peer unstructured negotiation')
  })

  test('modal shows analogy and primary focus', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await page.getByTestId('taxonomy-browser-card-0').click()

    const dialog = page.getByTestId('taxonomy-dialog')
    await expect(dialog).toBeVisible()

    const analogy = dialog.getByTestId('taxonomy-modal-analogy')
    await expect(analogy).toBeVisible()
    await expect(analogy).toContainText('Like a software engineering manager')

    const focus = dialog.getByTestId('taxonomy-modal-primary-focus')
    await expect(focus).toBeVisible()
    await expect(focus).toContainText('Task decomposition')
  })

  test('modal content is scrollable', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await page.getByTestId('taxonomy-browser-card-0').click()

    const dialog = page.getByTestId('taxonomy-dialog')
    await expect(dialog).toBeVisible()

    const scrollContainer = dialog.locator('.taxonomy-modal-scroll').first()
    const scrollHeight = await scrollContainer.evaluate((el) => el.scrollHeight)
    const clientHeight = await scrollContainer.evaluate((el) => el.clientHeight)
    expect(scrollHeight).toBeGreaterThan(clientHeight)
  })
})
