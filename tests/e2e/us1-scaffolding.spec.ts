import { test, expect } from '@playwright/test'

test.describe('US-1: Scaffolding + Shell', () => {
  test('navigates to home page and finds topnav with topic links', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Interactive Loom Learning OS')

    await expect(page.locator('.topnav')).toBeVisible()
    await expect(page.locator('.topnav-title')).toHaveText('Learning OS')

    const overviewLink = page.locator('.topnav-link').first()
    await expect(overviewLink).toBeVisible()
    await expect(overviewLink).toHaveText('Overview')

    const allLinks = page.locator('.topnav-link')
    await expect(allLinks).toHaveCount(7)

    const topicLinks = page.locator('.topnav-link').nth(1)
    await expect(page.locator('.topnav-link').filter({ hasNot: page.getByText('Overview') })).toHaveCount(6)
    await expect(topicLinks).toHaveText('AI Agent Architecture (Demo)')

    await expect(page.locator('.overview-page')).toBeVisible()
    await expect(page.locator('.overview-page-title')).toHaveText('Interactive Learning Platform')

    const topicLink = page.getByTestId('topic-link-demo')
    await expect(topicLink).toBeVisible()
    await expect(topicLink).toHaveText('AI Agent Architecture (Demo)')
  })

  test('topnav Overview link is active on home page', async ({ page }) => {
    await page.goto('/')
    const overviewLink = page.locator('.topnav-link').first()
    await expect(overviewLink).toHaveClass(/topnav-link-active/)
  })

  test('topnav topic link navigates to topic page', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('topic-link-demo').click()
    await expect(page).toHaveURL('/#/demo/ai-agent')
    await expect(page.locator('.topic-page')).toBeVisible()
  })
})
