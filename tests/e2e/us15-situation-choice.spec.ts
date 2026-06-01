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

    const wsTrigger = page.getByTestId('situation-card-trigger-0-websocket')
    await expect(wsTrigger).toHaveAttribute('aria-expanded', 'true')

    const restTrigger = page.getByTestId('situation-card-trigger-0-rest')
    await expect(restTrigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('clicking non-recommended card opens it in accordion', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const restTrigger = page.getByTestId('situation-card-trigger-0-rest')
    await restTrigger.click()

    await expect(restTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('situation-card-trigger-0-websocket')).toHaveAttribute('aria-expanded', 'false')
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

  // ─── Compare All Modal ─────────────────────────────────────

  test('Compare All button is rendered', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const button = page.getByTestId('compare-all-button-0')
    await expect(button).toBeVisible()
    await expect(button).toContainText('Compare All')
  })

  test('clicking Compare All opens modal', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('compare-all-button-0').click()

    const dialog = page.getByTestId('compare-dialog-0')
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId('compare-overlay-0')).toBeVisible()
  })

  test('modal shows 2-column grid with all choices', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()

    const grid = page.getByTestId('compare-grid-0')
    await expect(grid).toBeVisible()
    await expect(page.getByTestId('compare-card-0-rest')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-websocket')).toBeVisible()
  })

  test('each choice shows label', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()

    await expect(page.getByTestId('compare-card-label-0-rest')).toBeVisible()
    await expect(page.getByTestId('compare-card-label-0-websocket')).toBeVisible()
  })

  test('each choice shows pros with Check icon', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()

    await expect(page.getByTestId('compare-icon-pro-0-websocket-0')).toBeVisible()
  })

  test('each choice shows cons with X icon', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()

    await expect(page.getByTestId('compare-icon-con-0-websocket-0')).toBeVisible()
  })

  test('recommended choice has Recommended badge', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()

    await expect(page.getByTestId('compare-badge-0-websocket')).toBeVisible()
    await expect(page.getByTestId('compare-badge-0-websocket')).toContainText('Recommended')
  })

  test('recommendationDetail.why is displayed above grid', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()

    const why = page.getByTestId('compare-why-0')
    await expect(why).toBeVisible()
    await expect(why).toContainText('full-duplex, persistent connections')
  })

  test('modal dismissible with Escape key', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()
    await expect(page.getByTestId('compare-dialog-0')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('compare-dialog-0')).not.toBeVisible()
  })

  test('modal dismissible by clicking outside', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()
    await expect(page.getByTestId('compare-dialog-0')).toBeVisible()

    // Click on the overlay above the dialog content
    const dialogBox = await page.getByTestId('compare-dialog-0').boundingBox()
    await page.mouse.click(dialogBox.x + dialogBox.width / 2, dialogBox.y - 20)
    await expect(page.getByTestId('compare-dialog-0')).not.toBeVisible()
  })

  test('modal dismissible with close button', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button-0').click()
    await expect(page.getByTestId('compare-dialog-0')).toBeVisible()

    await page.getByTestId('compare-dialog-close-0').click()
    await expect(page.getByTestId('compare-dialog-0')).not.toBeVisible()
  })

  // ─── Situation Dropdown (Issue #17) ──────────────────────────

  test('dropdown is visible when multiple situations', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const dropdown = page.getByTestId('situation-dropdown')
    await expect(dropdown).toBeVisible()
    const select = page.getByTestId('situation-select')
    await expect(select).toBeVisible()
  })

  test('dropdown shows first situation title by default', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const select = page.getByTestId('situation-select')
    await expect(select).toContainText('Real-time Communication')
  })

  test('clicking dropdown opens options', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('situation-select').click()

    const option1 = page.getByRole('option', { name: 'Real-time Communication' })
    const option2 = page.getByRole('option', { name: 'Batch Data Processing' })
    await expect(option1).toBeVisible()
    await expect(option2).toBeVisible()
  })

  test('selecting situation updates situation banner', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('situation-banner-0')).toContainText('chat application')
    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Batch Data Processing' }).click()

    await expect(page.getByTestId('situation-banner-1')).toContainText('large datasets')
  })

  test('selecting situation updates recommendation banner', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('recommendation-banner-0')).toBeVisible()
    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Batch Data Processing' }).click()

    await expect(page.getByTestId('recommendation-banner-1')).toBeVisible()
    await expect(page.getByTestId('recommendation-banner-1')).toContainText('batch endpoints')
  })

  test('selecting situation updates accordion cards', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('situation-card-0-websocket')).toBeVisible()
    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Batch Data Processing' }).click()

    await expect(page.getByTestId('situation-card-1-rest')).toBeVisible()
    await expect(page.getByTestId('situation-card-1-websocket')).toBeVisible()
  })

  test('accordion resets to recommended card open on situation change', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    // First situation: websocket is recommended, open by default
    await expect(page.getByTestId('situation-card-trigger-0-websocket')).toHaveAttribute('aria-expanded', 'true')

    // Switch to second situation: rest is recommended, should be open
    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Batch Data Processing' }).click()

    await expect(page.getByTestId('situation-card-trigger-1-rest')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('situation-card-trigger-1-websocket')).toHaveAttribute('aria-expanded', 'false')
  })

  test('selecting option closes dropdown', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('situation-select').click()
    await expect(page.getByRole('option', { name: 'Real-time Communication' })).toBeVisible()

    await page.getByRole('option', { name: 'Batch Data Processing' }).click()

    await expect(page.getByRole('option', { name: 'Real-time Communication' })).not.toBeVisible()
    await expect(page.getByRole('option', { name: 'Batch Data Processing' })).not.toBeVisible()
  })

  // ─── Animation Tests (Issue #19) ──────────────────────────────

  test('situation card entrance animation plays on mount', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const item = page.getByTestId('situation-choice-item-0')
    await expect(item).toBeVisible()

    await page.waitForTimeout(700)
    const opacity = await item.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeCloseTo(1, 1)
  })

  test('recommendation banner entrance animation plays on mount', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const banner = page.getByTestId('recommendation-banner-0')
    await expect(banner).toBeVisible()

    await page.waitForTimeout(700)
    const opacity = await banner.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeCloseTo(1, 1)
  })

  test('recommended card emphasis animation plays on mount', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const recCard = page.getByTestId('situation-card-0-websocket')
    await expect(recCard).toBeVisible()

    await page.waitForTimeout(700)
    const opacity = await recCard.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeCloseTo(1, 1)
  })

  test('accordion expand animation animates height', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const restTrigger = page.getByTestId('situation-card-trigger-0-rest')
    await restTrigger.click()

    await page.waitForTimeout(400)
    const wrapper = page.getByTestId('situation-card-content-wrapper-0-rest')
    const height = await wrapper.evaluate((el) => parseFloat(getComputedStyle(el).height))
    expect(height).toBeGreaterThan(50)
  })

  test('accordion collapse animation hides content', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const restTrigger = page.getByTestId('situation-card-trigger-0-rest')
    await restTrigger.click()

    await page.waitForTimeout(400)
    const wsWrapper = page.getByTestId('situation-card-content-wrapper-0-websocket')
    const height = await wsWrapper.evaluate((el) => parseFloat(getComputedStyle(el).height))
    expect(height).toBeCloseTo(0, 0)
  })

  test('accordion content wrapper always in DOM (animated not conditional)', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const restWrapper = page.getByTestId('situation-card-content-wrapper-0-rest')
    await expect(restWrapper).toBeTruthy()

    const wsWrapper = page.getByTestId('situation-card-content-wrapper-0-websocket')
    await expect(wsWrapper).toBeTruthy()
  })

  test('useAnimation hook drives entrance animations', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const item = page.getByTestId('situation-choice-item-0')
    await page.waitForTimeout(500)
    await expect(item).toBeVisible()

    const banner = page.getByTestId('recommendation-banner-0')
    await expect(banner).toBeVisible()

    const recCard = page.getByTestId('situation-card-0-websocket')
    await expect(recCard).toBeVisible()
  })
})
