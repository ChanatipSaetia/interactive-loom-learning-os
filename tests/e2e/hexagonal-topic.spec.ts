import { test, expect } from '@playwright/test'

test.describe('Hexagonal Architecture Topic E2E Test', () => {
  test('navigates to hexagonal-architecture topic and verifies all sections render cleanly', async ({ page }) => {
    // 1. Visit main catalog page
    await page.goto('/')

    // 2. Click the Hexagonal Architecture topic link using test-id
    const topicCard = page.getByTestId('topic-link-hexagonal-architecture')
    await expect(topicCard).toBeVisible()
    await topicCard.click()

    // 3. Wait for topic loading indicator to finish
    await expect(page.locator('.topic-loading')).not.toBeVisible({ timeout: 10000 })

    // 4. Verify topic page title renders
    const titleHeader = page.locator('.topic-page-title')
    await expect(titleHeader).toBeVisible()

    // 5. Wait for all 10 section wrappers to be rendered
    const sectionWrappers = page.locator('.section-wrapper')
    await expect(sectionWrappers).toHaveCount(10, { timeout: 10000 })

    // 6. Log all data-section-type attributes
    const types = await sectionWrappers.evaluateAll((els) => els.map((el) => el.getAttribute('data-section-type')))
    console.log('E2E RENDERED SECTION TYPES:', types)

    expect(types).toHaveLength(10)
    expect(types).toContain('intro')
    expect(types).toContain('flashcards')
    expect(types).toContain('concept-map')
    expect(types).toContain('flowchart')
    expect(types).toContain('quiz')
  })
})
