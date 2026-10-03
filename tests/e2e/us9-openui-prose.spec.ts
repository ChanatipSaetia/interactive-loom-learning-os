import { test, expect } from '@playwright/test'

// Prose sections are `openui` sections (the `text` type was retired):
// one markdown TextContent block per paragraph.
test.describe('US-9: OpenUI prose section', () => {
  test('renders the migrated Agent Lifecycle section with its paragraphs', async ({ page }) => {
    await page.goto('/#/topics/demo')

    const section = page.locator('.section-wrapper[data-section-type="openui"]').first()
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByTestId('openui-title')).toHaveText('Agent Lifecycle', { timeout: 30000 })

    const content = section.getByTestId('openui-content')
    await expect(content.locator('.openui-text-content-markdown')).toHaveCount(6)
    await expect(content).toContainText('The user submits a natural-language goal')
    await expect(content.locator('strong').first()).toHaveText('Goal Intake')
    await expect(section.getByTestId('openui-errors')).toHaveCount(0)
  })

  test('keeps the heading of a migrated section', async ({ page }) => {
    await page.goto('/#/topics/gamification')

    const section = page.locator('.section-wrapper[data-section-type="openui"]').first()
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByTestId('openui-title')).toHaveText('The Psychology of Motivation', { timeout: 30000 })
    await expect(section.getByTestId('openui-heading')).toHaveText('Why people actually do things')
  })
})
