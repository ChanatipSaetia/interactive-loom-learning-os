import { test, expect } from '@playwright/test'

test.describe('Issue #21: TradeoffSandbox Section', () => {
  test('renders tradeoff sandbox section', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const section = page.getByTestId('tradeoff-sandbox')
    await expect(section).toBeVisible()
  })

  test('renders section title', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const title = page.getByTestId('tradeoff-sandbox-title')
    await expect(title).toBeVisible()
    await expect(title).toContainText('Architecture Trade-off Sandbox')
  })

  test('renders scenario dropdown with multiple scenarios', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const dropdown = page.getByTestId('scenario-dropdown')
    await expect(dropdown).toBeVisible()
    const select = page.getByTestId('scenario-select')
    await expect(select).toBeVisible()
  })

  test('dropdown shows first scenario by default', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const select = page.getByTestId('scenario-select')
    await expect(select).toContainText('Enterprise Web Application')
  })

  test('clicking dropdown opens scenario options', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('scenario-select').click()

    const opt1 = page.getByRole('option', { name: 'Enterprise Web Application' })
    const opt2 = page.getByRole('option', { name: 'Real-Time Chat & Collab System' })
    const opt3 = page.getByRole('option', { name: 'High-Security Financial Auditing Platform' })
    await expect(opt1).toBeVisible()
    await expect(opt2).toBeVisible()
    await expect(opt3).toBeVisible()
  })

  test('selecting scenario updates banner description', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('scenario-banner')).toContainText('React SPA')
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()

    await expect(page.getByTestId('scenario-banner')).toContainText('WebAssembly')
  })

  test('selecting scenario resets metrics to base values', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    // Select a choice first
    await page.getByTestId('choice-card-0-0-react-spa').click()

    // Switch scenario
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()

    // Metrics should be base values for new scenario
    await expect(page.getByTestId('metric-value-latency')).toHaveText('40')
    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
  })

  test('selecting option closes dropdown', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('scenario-select').click()
    await expect(page.getByRole('option', { name: 'Enterprise Web Application' })).toBeVisible()

    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()

    await expect(page.getByRole('option', { name: 'Enterprise Web Application' })).not.toBeVisible()
  })

  // ─── Metric Dashboard ──────────────────────────────────

  test('renders metric dashboard', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const dashboard = page.getByTestId('metric-dashboard')
    await expect(dashboard).toBeVisible()
    await expect(dashboard).toContainText('Metric Dashboard')
  })

  test('renders all metric bars for current scenario', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('metric-bar-performance')).toBeVisible()
    await expect(page.getByTestId('metric-bar-scalability')).toBeVisible()
    await expect(page.getByTestId('metric-bar-complexity')).toBeVisible()
    await expect(page.getByTestId('metric-bar-cost')).toBeVisible()
  })

  test('shows base metric values', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
    await expect(page.getByTestId('metric-value-scalability')).toHaveText('50')
    await expect(page.getByTestId('metric-value-complexity')).toHaveText('30')
    await expect(page.getByTestId('metric-value-cost')).toHaveText('50')
  })

  test('shows metric labels', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('metric-label-performance')).toContainText('Performance')
    await expect(page.getByTestId('metric-label-scalability')).toContainText('Scalability')
  })

  test('shows progress indicator', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
  })

  // ─── Steps Panel ───────────────────────────────────────

  test('renders steps panel', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const panel = page.getByTestId('steps-panel')
    await expect(panel).toBeVisible()
  })

  test('renders all step sections', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('step-section-0-0')).toBeVisible()
    await expect(page.getByTestId('step-section-0-1')).toBeVisible()
    await expect(page.getByTestId('step-section-0-2')).toBeVisible()
  })

  test('renders step titles', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('step-title-0-0')).toContainText('Frontend Framework')
    await expect(page.getByTestId('step-title-0-1')).toContainText('Backend Architecture')
    await expect(page.getByTestId('step-title-0-2')).toContainText('Data Storage')
  })

  test('renders choice cards in tray', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('choice-card-0-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('choice-card-0-0-next-ssr')).toBeVisible()
  })

  test('renders choice card labels', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('choice-card-label-0-0-react-spa')).toContainText('React SPA')
    await expect(page.getByTestId('choice-card-label-0-0-next-ssr')).toContainText('Next.js SSR')
  })

  test('renders drop zone with placeholder', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('drop-zone-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-placeholder-0-0')).toContainText('Drag or click a choice here')
  })

  // ─── Click-to-Drop ────────────────────────────────────

  test('clicking choice card selects it in drop zone', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()

    const content = page.getByTestId('drop-zone-content-0-0')
    await expect(content).toBeVisible()
    await expect(content).toContainText('React SPA')
  })

  test('selected choice card shows placed badge', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()

    const badge = page.getByTestId('choice-placed-badge-0-0-react-spa')
    await expect(badge).toBeVisible()
    await expect(badge).toContainText('Placed')
  })

  test('placed card is disabled in browser', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()

    const placedCard = page.getByTestId('choice-card-0-0-react-spa')
    await expect(placedCard).toHaveAttribute('aria-disabled', 'true')
    const tabindex = await placedCard.getAttribute('tabindex')
    expect(tabindex).toBe('-1')
  })

  test('selecting different choice replaces previous', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')

    await page.getByTestId('choice-card-0-0-next-ssr').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('Next.js SSR')
  })

  test('drop zone shows remove button when filled', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-remove-0-0')).toBeVisible()
  })

  test('clicking remove button clears drop zone', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()

    await page.getByTestId('drop-zone-remove-0-0').click()
    await expect(page.getByTestId('drop-zone-placeholder-0-0')).toBeVisible()
  })

  // ─── Metric Updates ────────────────────────────────────

  test('metrics update when choice is placed', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')
  })

  test('metrics update when choice changes', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')

    await page.getByTestId('choice-card-0-0-next-ssr').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('65')
  })

  test('metrics reset when choice is removed', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')

    await page.getByTestId('drop-zone-remove-0-0').click()
    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
  })

  // ─── Progress Updates ──────────────────────────────────

  test('progress updates when choice placed', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('1 / 3')
  })

  test('progress accumulates across steps', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('1 / 3')

    await page.getByTestId('choice-card-0-1-microservices').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('2 / 3')
  })

  // ─── Drag and Drop ─────────────────────────────────────

  test('choice card is draggable', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const card = page.getByTestId('choice-card-0-0-react-spa')
    const draggable = await card.getAttribute('draggable')
    expect(draggable).toBe('true')
  })

  test('dragging choice to drop zone selects it', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const card = page.getByTestId('choice-card-0-0-react-spa')
    const dropZone = page.getByTestId('drop-zone-0-0')

    await card.dragTo(dropZone)

    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')
  })

  // ─── Compare All Modal ─────────────────────────────────

  test('Compare All button is rendered', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const button = page.getByTestId('compare-all-button')
    await expect(button).toBeVisible()
    await expect(button).toContainText('Compare All')
  })

  test('clicking Compare All opens modal', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('compare-all-button').click()

    const dialog = page.getByTestId('compare-dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId('compare-overlay')).toBeVisible()
  })

  test('modal shows step sections', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()

    await expect(page.getByTestId('compare-step-0')).toBeVisible()
    await expect(page.getByTestId('compare-step-title-0')).toContainText('Frontend Framework')
  })

  test('modal shows 2-column grid with all choices', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()

    await expect(page.getByTestId('compare-grid-0')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-next-ssr')).toBeVisible()
  })

  test('modal shows choice labels', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()

    await expect(page.getByTestId('compare-card-label-0-react-spa')).toContainText('React SPA')
    await expect(page.getByTestId('compare-card-label-0-next-ssr')).toContainText('Next.js SSR')
  })

  test('modal shows pros with Check icon', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()

    await expect(page.getByTestId('compare-pros-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-pro-0-react-spa-0')).toBeVisible()
  })

  test('modal shows cons with X icon', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()

    await expect(page.getByTestId('compare-cons-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-con-0-react-spa-0')).toBeVisible()
  })

  test('selected choice has Selected badge in modal', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').click()
    await page.getByTestId('compare-all-button').click()

    await expect(page.getByTestId('compare-badge-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-badge-0-react-spa')).toContainText('Selected')
  })

  test('modal dismissible with Escape key', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()
    await expect(page.getByTestId('compare-dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('compare-dialog')).not.toBeVisible()
  })

  test('modal dismissible by clicking outside', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()
    await expect(page.getByTestId('compare-dialog')).toBeVisible()

    const dialogBox = await page.getByTestId('compare-dialog').boundingBox()
    await page.mouse.click(dialogBox.x + dialogBox.width / 2, dialogBox.y - 20)
    await expect(page.getByTestId('compare-dialog')).not.toBeVisible()
  })

  test('modal dismissible with close button', async ({ page }) => {
    await page.goto('/demo/ai-agent')
    await page.getByTestId('compare-all-button').click()
    await expect(page.getByTestId('compare-dialog')).toBeVisible()

    await page.getByTestId('compare-dialog-close').click()
    await expect(page.getByTestId('compare-dialog')).not.toBeVisible()
  })

  // ─── Keyboard Accessibility ────────────────────────────

  test('choice card is keyboard focusable', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const card = page.getByTestId('choice-card-0-0-react-spa')
    const tabindex = await card.getAttribute('tabindex')
    expect(tabindex).toBe('0')
  })

  test('choice card has role button', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    const card = page.getByTestId('choice-card-0-0-react-spa')
    const role = await card.getAttribute('role')
    expect(role).toBe('button')
  })

  test('Enter key selects choice', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').focus()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')
  })

  test('Space key selects choice', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('choice-card-0-0-react-spa').focus()
    await page.keyboard.press('Space')

    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')
  })

  // ─── Cross-Scenario Metrics ────────────────────────────

  test('different scenario has different metrics', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'High-Security Financial Auditing Platform' }).click()

    await expect(page.getByTestId('metric-value-security')).toHaveText('50')
    await expect(page.getByTestId('metric-value-compliance')).toHaveText('40')
  })

  test('financial scenario has different step titles', async ({ page }) => {
    await page.goto('/demo/ai-agent')

    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'High-Security Financial Auditing Platform' }).click()

    await expect(page.getByTestId('step-title-2-0')).toContainText('UI Framework')
    await expect(page.getByTestId('step-title-2-1')).toContainText('Backend Pattern')
    await expect(page.getByTestId('step-title-2-2')).toContainText('Deployment Strategy')
  })
})
