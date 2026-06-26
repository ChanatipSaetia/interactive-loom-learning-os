import { test, expect } from '@playwright/test'

test.describe('Issue #68: Unified flexible layout with dynamic rows', () => {
  test('renders flowchart with dynamic layout', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(page.getByTestId('demo-topic')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('flowchart-svg-EVENT_STORMING')).toBeVisible({ timeout: 10000 })

    const nodes = page.locator('[data-testid^="flowchart-node-EVENT_STORMING-"]')
    await expect.poll(() => nodes.count()).toBeGreaterThan(0)
  })

  test('SYS_ARCH view renders with dynamic rows', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(page.getByTestId('demo-topic')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('flowchart-svg-EVENT_STORMING')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('dock-tab-views').click()
    const sysArchTab = page.locator('.flowchart-view-tab-trigger').filter({ hasText: 'System Architecture' })
    await sysArchTab.click()
    await page.waitForTimeout(500)

    const sysNodes = page.locator('[data-testid^="flowchart-node-SYS_ARCH-"]')
    await expect.poll(() => sysNodes.count()).toBeGreaterThan(1)
  })

  test('all derived views are available and render', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(page.getByTestId('demo-topic')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('flowchart-svg-EVENT_STORMING')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('dock-tab-views').click()
    const viewTabs = page.getByTestId('flowchart-view-tabs')
    await expect(viewTabs).toBeVisible()

    const tabTexts = await viewTabs.locator('.flowchart-view-tab-label').evaluateAll(el => el.map(e => e.textContent?.trim()))
    expect(tabTexts).toContain('System Architecture')
    expect(tabTexts).toContain('Activity Swimlanes')
    expect(tabTexts).toContain('Sequence Diagram')
    expect(tabTexts).toContain('Data Flow')
  })
})
