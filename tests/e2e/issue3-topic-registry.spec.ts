import { test, expect } from '@playwright/test'

test.describe('Topic OKF loading', () => {
  test('demo topic loads and renders', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const topicPage = page.locator('.topic-page')
    await expect(topicPage).toBeVisible()

    const topicTitle = page.locator('.topic-page-title')
    await expect(topicTitle).toHaveText('AI Agent Architecture (Demo)')

    const topicContainer = page.locator('[data-topic-id="demo"]')
    await expect(topicContainer).toBeVisible()
  })

  test('unknown topic shows not found', async ({ page }) => {
    await page.goto('/#/nonexistent/path')

    const topicTitle = page.locator('.topic-page-title')
    await expect(topicTitle).toHaveText('Topic Not Found')
  })
})
