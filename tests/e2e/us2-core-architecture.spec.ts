import { test, expect } from '@playwright/test'

test.describe('US-2: Core Architecture + Section Registry', () => {
  test('topic page loads from route config via TopicShell', async ({ page }) => {
    await page.goto('/')

    const topicCard = page.locator('.home-topic-card').first()
    await expect(topicCard).toBeVisible()
    await topicCard.click()

    await expect(page).toHaveURL('/demo/rest-vs-websocket')

    const topicPage = page.locator('.topic-page')
    await expect(topicPage).toBeVisible()

    const topicTitle = page.locator('.topic-page-title')
    await expect(topicTitle).toHaveText('REST API vs WebSocket')

    const topicContainer = page.locator('[data-topic-id="demo"]')
    await expect(topicContainer).toBeVisible()
  })

  test('navigating to unknown topic shows not found', async ({ page }) => {
    await page.goto('/nonexistent/path')

    const topicTitle = page.locator('.topic-page-title')
    await expect(topicTitle).toHaveText('Topic Not Found')
  })
})
