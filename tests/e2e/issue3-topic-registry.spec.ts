import { test, expect } from '@playwright/test'

test.describe('Issue #3: TopicRegistry seam', () => {
  test('demo topic loads via TopicRegistry resolution', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const topicPage = page.locator('.topic-page')
    await expect(topicPage).toBeVisible()

    const topicTitle = page.locator('.topic-page-title')
    await expect(topicTitle).toHaveText('AI Agent Architecture (Demo)')

    const topicContainer = page.locator('[data-topic-id="demo"]')
    await expect(topicContainer).toBeVisible()

    const demoTopic = page.locator('[data-testid="demo-topic"]')
    await expect(demoTopic).toBeVisible()
  })

  test('topic component not registered shows placeholder', async ({ page }) => {
    await page.goto('/#/nonexistent/path')

    const topicTitle = page.locator('.topic-page-title')
    await expect(topicTitle).toHaveText('Topic Not Found')
  })
})
