import { test, expect } from '@playwright/test'

test.describe('Issue #15: SituationChoice Section', () => {
  test('renders situation choice section', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const section = page.getByTestId('situation-choice')
    await expect(section).toBeVisible()
  })

  test('renders situation banner with contextual background', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const banner = page.getByTestId('situation-banner-0')
    await expect(banner).toBeVisible()
  })

  test('renders recommendation banner with green accent', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const recBanner = page.getByTestId('recommendation-banner-0')
    await expect(recBanner).toBeVisible()
    await expect(recBanner).toContainText('full-duplex, persistent connections')
  })

  test('recommended card is open by default', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const wsContent = page.getByTestId('situation-card-content-0-websocket')
    await expect(wsContent).toBeVisible()

    const restContent = page.getByTestId('situation-card-content-0-rest')
    await expect(restContent).not.toBeVisible()
  })

  test('clicking non-recommended card opens it in accordion', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const restTrigger = page.getByTestId('situation-card-trigger-0-rest')
    await restTrigger.click()

    const restContent = page.getByTestId('situation-card-content-0-rest')
    await expect(restContent).toBeVisible()

    const wsContent = page.getByTestId('situation-card-content-0-websocket')
    await expect(wsContent).not.toBeVisible()
  })

  test('renders recommended badge', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const badge = page.getByTestId('situation-badge-0-websocket')
    await expect(badge).toBeVisible()
    await expect(badge).toContainText('Recommended')
  })

  test('expanded card shows pros and cons', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('situation-pros-0-websocket')).toBeVisible()
    await expect(page.getByTestId('situation-cons-0-websocket')).toBeVisible()
    await expect(page.getByTestId('situation-bullet-pro-0-websocket-0')).toBeVisible()
    await expect(page.getByTestId('situation-bullet-con-0-websocket-0')).toBeVisible()
  })

  test('non-recommended card shows whenToUse when expanded', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const restTrigger = page.getByTestId('situation-card-trigger-0-rest')
    await restTrigger.click()

    const whenToUse = page.getByTestId('situation-when-to-use-0-rest')
    await expect(whenToUse).toBeVisible()
  })
})
