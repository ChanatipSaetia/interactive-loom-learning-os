import { test, expect } from '@playwright/test'

test.describe('US-1: Scaffolding + Shell', () => {
  test('navigates to home page and finds sidebar with topic links', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Interactive Loom Learning OS')

    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.sidebar-title')).toHaveText('Learning OS')

    const overviewLink = page.locator('.sidebar-link-home')
    await expect(overviewLink).toBeVisible()
    await expect(overviewLink).toHaveText('Overview')

    const topicLinks = page.locator('.sidebar-link:not(.sidebar-link-home)')
    await expect(topicLinks).toHaveCount(1)
    await expect(topicLinks.first()).toHaveText('REST API vs WebSocket')

    await expect(page.locator('.overview-page')).toBeVisible()
    await expect(page.locator('.overview-page-title')).toHaveText('Interactive Learning Platform')

    const topicLink = page.getByTestId('topic-link-demo')
    await expect(topicLink).toBeVisible()
    await expect(topicLink).toHaveText('REST API vs WebSocket')
  })

  test('sidebar Overview link is active on home page', async ({ page }) => {
    await page.goto('/')
    const overviewLink = page.locator('.sidebar-link-home')
    await expect(overviewLink).toHaveClass(/sidebar-link-active/)
  })

  test('sidebar topic link navigates to topic page', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('topic-link-demo').click()
    await expect(page).toHaveURL('/demo/rest-vs-websocket')
    await expect(page.locator('.topic-page')).toBeVisible()
  })
})
