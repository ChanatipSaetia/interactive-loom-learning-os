import { test, expect, type Page } from '@playwright/test'

/** The section opens on Compare options; most tests drive the sandbox under Try it. */
async function openTryIt(page: Page) {
  await page.goto('/#/demo/ai-agent')
  await page.getByTestId('tradeoff-tab-sandbox').click()
}

test.describe('Issue #21: TradeoffSandbox Section', () => {
  test('renders tradeoff sandbox section', async ({ page }) => {
    await openTryIt(page)

    const section = page.getByTestId('tradeoff-sandbox')
    await expect(section).toBeVisible()
  })

  test('renders section title', async ({ page }) => {
    await openTryIt(page)

    const title = page.getByTestId('tradeoff-sandbox-title')
    await expect(title).toBeVisible()
    await expect(title).toContainText('Architecture Trade-off Sandbox')
  })

  test('renders scenario dropdown with multiple scenarios', async ({ page }) => {
    await openTryIt(page)

    const dropdown = page.getByTestId('scenario-dropdown')
    await expect(dropdown).toBeVisible()
    const select = page.getByTestId('scenario-select')
    await expect(select).toBeVisible()
  })

  test('dropdown shows first scenario by default', async ({ page }) => {
    await openTryIt(page)

    const select = page.getByTestId('scenario-select')
    await expect(select).toContainText('Enterprise Web Application')
  })

  test('clicking dropdown opens scenario options', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('scenario-select').click()

    const opt1 = page.getByRole('option', { name: 'Enterprise Web Application' })
    const opt2 = page.getByRole('option', { name: 'Real-Time Chat & Collab System' })
    const opt3 = page.getByRole('option', { name: 'High-Security Financial Auditing Platform' })
    await expect(opt1).toBeVisible()
    await expect(opt2).toBeVisible()
    await expect(opt3).toBeVisible()
  })

  test('selecting scenario updates banner description', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('scenario-banner')).toContainText('React SPA')
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()

    await expect(page.getByTestId('scenario-banner')).toContainText('WebAssembly')
  })

  test('selecting scenario resets metrics to base values', async ({ page }) => {
    await openTryIt(page)

    // Open dropdown and select a choice
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()

    // Switch scenario
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()

    // Metrics should be base values for new scenario
    await expect(page.getByTestId('metric-value-latency')).toHaveText('40')
    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
  })

  test('selecting option closes dropdown', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('scenario-select').click()
    await expect(page.getByRole('option', { name: 'Enterprise Web Application' })).toBeVisible()

    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()

    await expect(page.getByRole('option', { name: 'Enterprise Web Application' })).not.toBeVisible()
  })

  // ─── Metric Dashboard ──────────────────────────────────

  test('renders metric dashboard', async ({ page }) => {
    await openTryIt(page)

    const dashboard = page.getByTestId('metric-dashboard')
    await expect(dashboard).toBeVisible()
    await expect(dashboard).toContainText('Metric Dashboard')
  })

  test('renders all metric bars for current scenario', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('metric-bar-performance')).toBeVisible()
    await expect(page.getByTestId('metric-bar-scalability')).toBeVisible()
    await expect(page.getByTestId('metric-bar-complexity')).toBeVisible()
    await expect(page.getByTestId('metric-bar-cost')).toBeVisible()
  })

  test('shows base metric values', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
    await expect(page.getByTestId('metric-value-scalability')).toHaveText('50')
    await expect(page.getByTestId('metric-value-complexity')).toHaveText('30')
    await expect(page.getByTestId('metric-value-cost')).toHaveText('50')
  })

  test('shows metric labels', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('metric-label-performance')).toContainText('Performance')
    await expect(page.getByTestId('metric-label-scalability')).toContainText('Scalability')
  })

  test('shows progress indicator', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
  })

  // ─── Steps Panel ───────────────────────────────────────

  test('renders steps panel', async ({ page }) => {
    await openTryIt(page)

    const panel = page.getByTestId('steps-panel')
    await expect(panel).toBeVisible()
  })

  test('renders all step sections', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('step-section-0-0')).toBeVisible()
    await expect(page.getByTestId('step-section-0-1')).toBeVisible()
    await expect(page.getByTestId('step-section-0-2')).toBeVisible()
  })

  test('renders step titles', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('step-title-0-0')).toContainText('Frontend Framework')
    await expect(page.getByTestId('step-title-0-1')).toContainText('Backend Architecture')
    await expect(page.getByTestId('step-title-0-2')).toContainText('Data Storage')
  })

  test('renders floating dropdown triggers', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('step-dropdown-trigger-0-0')).toBeVisible()
    await expect(page.getByTestId('step-dropdown-trigger-0-1')).toBeVisible()
  })

  test('renders drop zone with placeholder', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('drop-zone-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-placeholder-0-0')).toContainText('Select a choice from the dropdown')
  })

  // ─── Floating Dropdown Selection ──────────────────────

  test('clicking dropdown trigger opens options', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()

    await expect(page.getByTestId('step-dropdown-menu-0-0')).toBeVisible()
    await expect(page.getByTestId('dropdown-option-0-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('dropdown-option-0-0-next-ssr')).toBeVisible()
  })

  test('selecting dropdown option fills drop zone', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()

    const content = page.getByTestId('drop-zone-content-0-0')
    await expect(content).toBeVisible()
    await expect(content).toContainText('React SPA')
  })

  test('selecting different option replaces previous', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-next-ssr').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('Next.js SSR')
  })

  test('drop zone shows remove button when filled', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-remove-0-0')).toBeVisible()
  })

  test('clicking remove button clears drop zone', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()

    await page.getByTestId('drop-zone-remove-0-0').click()
    await expect(page.getByTestId('drop-zone-placeholder-0-0')).toBeVisible()
  })

  // ─── Recommended Badge ─────────────────────────────────

  test('recommended choice shows badge in dropdown', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await expect(page.getByTestId('recommended-badge-0-0-next-ssr')).toBeVisible()
    await expect(page.getByTestId('recommended-badge-0-0-next-ssr')).toContainText('Recommended')
  })

  test('recommended choice shows badge in drop zone when selected', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-next-ssr').click()

    await expect(page.getByTestId('drop-zone-recommended-badge-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-recommended-badge-0-0')).toContainText('Recommended')
  })

  // ─── Metric Updates ────────────────────────────────────

  test('metrics update when choice is selected', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')
  })

  test('metrics update when choice changes', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-next-ssr').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('65')
  })

  test('metrics reset when choice is removed', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')

    await page.getByTestId('drop-zone-remove-0-0').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
  })

  // ─── Progress Updates ──────────────────────────────────

  test('progress updates when choice selected', async ({ page }) => {
    await openTryIt(page)

    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('1 / 3')
  })

  test('progress accumulates across steps', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('1 / 3')

    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('2 / 3')
  })

  // ─── Compare options / Try it tabs ─────────────────────

  test('opens on Compare options and switches to Try it in place', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await expect(page.getByTestId('tradeoff-tab-compare')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('compare-scenarios')).toBeVisible()
    await expect(page.getByTestId('compare-all-button')).toHaveCount(0)
    await expect(page.getByTestId('compare-dialog')).toHaveCount(0)

    await page.getByTestId('tradeoff-tab-sandbox').click()
    await expect(page.getByTestId('metric-dashboard')).toBeVisible()
    await expect(page.getByTestId('compare-scenarios')).toBeHidden()
  })

  test('Compare options tab shows step sections', async ({ page }) => {
    await openTryIt(page)
    await page.getByTestId('tradeoff-tab-compare').click()

    await expect(page.getByTestId('compare-step-0')).toBeVisible()
    await expect(page.getByTestId('compare-step-title-0')).toContainText('Frontend Framework')
  })

  test('Compare options tab shows 2-column grid with all choices', async ({ page }) => {
    await openTryIt(page)
    await page.getByTestId('tradeoff-tab-compare').click()

    await expect(page.getByTestId('compare-grid-0')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-next-ssr')).toBeVisible()
  })

  test('Compare options tab shows choice labels', async ({ page }) => {
    await openTryIt(page)
    await page.getByTestId('tradeoff-tab-compare').click()

    await expect(page.getByTestId('compare-card-label-0-react-spa')).toContainText('React SPA')
    await expect(page.getByTestId('compare-card-label-0-next-ssr')).toContainText('Next.js SSR')
  })

  test('Compare options tab shows recommended badge', async ({ page }) => {
    await openTryIt(page)
    await page.getByTestId('tradeoff-tab-compare').click()

    await expect(page.getByTestId('compare-recommended-badge-0-next-ssr')).toBeVisible()
    await expect(page.getByTestId('compare-recommended-badge-0-next-ssr')).toContainText('Recommended')
  })

  test('Compare options tab shows pros with Check icon and description', async ({ page }) => {
    await openTryIt(page)
    await page.getByTestId('tradeoff-tab-compare').click()

    await expect(page.getByTestId('compare-pros-0-react-spa')).toBeVisible()
    const firstPro = page.getByTestId('compare-pro-0-react-spa-0')
    await expect(firstPro).toBeVisible()
    await expect(firstPro).toContainText('Rich ecosystem')
    await expect(firstPro).toContainText('Vast library support and community')
  })

  test('Compare options tab shows cons with X icon and description', async ({ page }) => {
    await openTryIt(page)
    await page.getByTestId('tradeoff-tab-compare').click()

    await expect(page.getByTestId('compare-cons-0-react-spa')).toBeVisible()
    const firstCon = page.getByTestId('compare-con-0-react-spa-0')
    await expect(firstCon).toBeVisible()
    await expect(firstCon).toContainText('SEO challenges')
    await expect(firstCon).toContainText('Requires SSR or SSG for search indexing')
  })

  test('selected choice has Selected badge in the Compare options tab', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('tradeoff-tab-compare').click()

    await expect(page.getByTestId('compare-badge-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-badge-0-react-spa')).toContainText('Selected')
  })

  // ─── Keyboard Accessibility ────────────────────────────

  test('dropdown trigger is keyboard focusable', async ({ page }) => {
    await openTryIt(page)

    const trigger = page.getByTestId('step-dropdown-trigger-0-0')
    await trigger.focus()
    await expect(trigger).toBeFocused()
  })

  test('Enter key opens dropdown', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').focus()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('step-dropdown-menu-0-0')).toBeVisible()
  })

  test('Space key opens dropdown', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').focus()
    await page.keyboard.press('Space')

    await expect(page.getByTestId('step-dropdown-menu-0-0')).toBeVisible()
  })

  test('Enter key selects dropdown option', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').focus()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')
  })

  // ─── Cross-Scenario Metrics ────────────────────────────

  test('different scenario has different metrics', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'High-Security Financial Auditing Platform' }).click()

    await expect(page.getByTestId('metric-value-security')).toHaveText('50')
    await expect(page.getByTestId('metric-value-compliance')).toHaveText('40')
  })

  // ─── Metric Bar Color Coding ────────────────────────────

  test('metric fill is neutral blue at base value', async ({ page }) => {
    await openTryIt(page)

    const fill = page.getByTestId('metric-fill-performance')
    const bg = await fill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toMatch(/rgb\(140, 170, 238\)/)
  })

  test('metric fill turns green when value improves', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()

    const fill = page.getByTestId('metric-fill-performance')
    const bg = await fill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toMatch(/rgb\(166, 209, 137\)/)
  })

  test('metric fill turns red when complexity increases (lower direction)', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()

    const fill = page.getByTestId('metric-fill-complexity')
    const bg = await fill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toMatch(/rgb\(231, 130, 132\)/)
  })

  test('metric fill turns green when complexity decreases', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-modular-monolith').click()

    const fill = page.getByTestId('metric-fill-complexity')
    const bg = await fill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toMatch(/rgb\(166, 209, 137\)/)
  })

  // ─── Feedback Banner ───────────────────────────────────

  test('feedback banner renders with empty state', async ({ page }) => {
    await openTryIt(page)

    const banner = page.getByTestId('feedback-banner')
    await expect(banner).toBeVisible()
    await expect(page.getByTestId('feedback-text')).toContainText('Make your first choice')
  })

  test('feedback banner updates to partial state after first choice', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()

    await expect(page.getByTestId('feedback-text')).toContainText('1 of 3 decisions made')
  })

  test('feedback banner updates to complete state when all choices made', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    await page.getByTestId('step-dropdown-trigger-0-2').click()
    await page.getByTestId('dropdown-option-0-2-postgresql').click()

    await expect(page.getByTestId('feedback-text')).toContainText('All decisions made')
  })

  test('feedback banner reverts to empty when all choices removed', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    await page.getByTestId('step-dropdown-trigger-0-2').click()
    await page.getByTestId('dropdown-option-0-2-postgresql').click()
    await expect(page.getByTestId('feedback-text')).toContainText('All decisions made')

    await page.getByTestId('drop-zone-remove-0-0').click()
    await page.getByTestId('drop-zone-remove-0-1').click()
    await page.getByTestId('drop-zone-remove-0-2').click()
    await expect(page.getByTestId('feedback-text')).toContainText('Make your first choice')
  })

  // ─── Financial Scenario ─────────────────────────────────

  test('financial scenario has different step titles', async ({ page }) => {
    await openTryIt(page)

    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'High-Security Financial Auditing Platform' }).click()

    await expect(page.getByTestId('step-title-2-0')).toContainText('UI Framework')
    await expect(page.getByTestId('step-title-2-1')).toContainText('Backend Pattern')
    await expect(page.getByTestId('step-title-2-2')).toContainText('Deployment Strategy')
  })
})
