import { test, expect } from '@playwright/test'

test.describe('Issue #25: TradeoffSandbox Testing Suite', () => {
  const baseUrl = '/#/demo/ai-agent'

  // ─── Reset to Optimal State ─────────────────────────────────────

  test('reset to optimal state removes all choices and restores base metrics', async ({ page }) => {
    await page.goto(baseUrl)

    // Place choices in all 3 steps via dropdown
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    await page.getByTestId('step-dropdown-trigger-0-2').click()
    await page.getByTestId('dropdown-option-0-2-postgresql').click()

    // Verify all choices placed
    await expect(page.getByTestId('progress-indicator')).toHaveText('3 / 3')
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-1')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-2')).toBeVisible()

    // Remove all choices
    await page.getByTestId('drop-zone-remove-0-0').click()
    await page.getByTestId('drop-zone-remove-0-1').click()
    await page.getByTestId('drop-zone-remove-0-2').click()

    // Verify reset to optimal/base state
    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
    await expect(page.getByTestId('metric-value-scalability')).toHaveText('50')
    await expect(page.getByTestId('metric-value-complexity')).toHaveText('30')
    await expect(page.getByTestId('metric-value-cost')).toHaveText('50')
    await expect(page.getByTestId('drop-zone-placeholder-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-placeholder-0-1')).toBeVisible()
    await expect(page.getByTestId('drop-zone-placeholder-0-2')).toBeVisible()
  })

  test('reset to optimal state via scenario switch restores all base metrics', async ({ page }) => {
    await page.goto(baseUrl)

    // Place choices in Enterprise scenario
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('2 / 3')

    // Switch to another scenario then back to reset
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
    await expect(page.getByTestId('metric-value-latency')).toHaveText('40')

    // Switch back to Enterprise
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Enterprise Web Application' }).click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
    await expect(page.getByTestId('metric-value-performance')).toHaveText('50')
    await expect(page.getByTestId('metric-value-scalability')).toHaveText('50')
    await expect(page.getByTestId('metric-value-complexity')).toHaveText('30')
    await expect(page.getByTestId('metric-value-cost')).toHaveText('50')
  })

  // ─── Screen Resizing / Layout Responsiveness ────────────────────

  test('layout remains intact at mobile viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(baseUrl)

    // All key elements should remain visible
    await expect(page.getByTestId('tradeoff-sandbox')).toBeVisible()
    await expect(page.getByTestId('metric-dashboard')).toBeVisible()
    await expect(page.getByTestId('steps-panel')).toBeVisible()
    await expect(page.getByTestId('scenario-select')).toBeVisible()
    await expect(page.getByTestId('compare-all-button')).toBeVisible()
    await expect(page.getByTestId('feedback-banner')).toBeVisible()
    await expect(page.getByTestId('progress-indicator')).toBeVisible()
  })

  test('metric bars remain readable at narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 })
    await page.goto(baseUrl)

    // Metric labels and values should be visible
    await expect(page.getByTestId('metric-label-performance')).toBeVisible()
    await expect(page.getByTestId('metric-value-performance')).toBeVisible()
    await expect(page.getByTestId('metric-track-performance')).toBeVisible()

    // Metric fill should have non-zero width
    const fill = page.getByTestId('metric-fill-performance')
    const fillBox = await fill.boundingBox()
    expect(fillBox?.width).toBeGreaterThan(0)
  })

  test('dropdown selection works at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    // Dropdown select should work
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')

    // Remove should work
    await page.getByTestId('drop-zone-remove-0-0').click()
    await expect(page.getByTestId('drop-zone-placeholder-0-0')).toBeVisible()
  })

  test('scenario dropdown remains usable at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(baseUrl)

    await page.getByTestId('scenario-select').click()
    await expect(page.getByRole('option', { name: 'Enterprise Web Application' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Real-Time Chat & Collab System' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'High-Security Financial Auditing Platform' })).toBeVisible()

    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()
    await expect(page.getByTestId('scenario-select')).toContainText('Real-Time Chat & Collab System')
  })

  test('compare modal adapts to narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 })
    await page.goto(baseUrl)

    await page.getByTestId('compare-all-button').click()
    await expect(page.getByTestId('compare-dialog')).toBeVisible()

    // All step sections should be in the modal
    await expect(page.getByTestId('compare-step-0')).toBeVisible()
    await expect(page.getByTestId('compare-step-1')).toBeVisible()
    await expect(page.getByTestId('compare-step-2')).toBeVisible()

    // Grid items should be visible
    await expect(page.getByTestId('compare-grid-0')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-next-ssr')).toBeVisible()

    // Modal should be dismissible
    await page.getByTestId('compare-dialog-close').click()
    await expect(page.getByTestId('compare-dialog')).not.toBeVisible()
  })

  test('keyboard navigation works at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('step-dropdown-menu-0-0')).toBeVisible()
  })

  test('large desktop viewport maintains layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(baseUrl)

    // Full-width sticky dashboard at top, steps panel below
    const dashboard = page.getByTestId('metric-dashboard')
    const stepsPanel = page.getByTestId('steps-panel')
    await expect(dashboard).toBeVisible()
    await expect(stepsPanel).toBeVisible()

    // Dashboard should span full width
    const dashBox = await dashboard.boundingBox()
    const stepsBox = await stepsPanel.boundingBox()
    expect(dashBox?.width).toBeGreaterThan(500)
    expect(stepsBox?.width).toBeGreaterThan(500)

    // Dashboard should be above steps panel
    expect(dashBox?.y).toBeLessThan(stepsBox?.y)
  })

  // ─── Validation Feedback: Optimal Process Comparison ────────────

  test('feedback banner reflects optimal state with no choices', async ({ page }) => {
    await page.goto(baseUrl)

    const feedback = page.getByTestId('feedback-text')
    await expect(feedback).toContainText('Make your first choice')

    const banner = page.getByTestId('feedback-banner')
    await expect(banner).toHaveClass(/feedback-banner-empty/)
  })

  test('feedback banner guides through partial to complete decisions', async ({ page }) => {
    await page.goto(baseUrl)

    // Empty state
    await expect(page.getByTestId('feedback-text')).toContainText('Make your first choice')

    // Partial state after 1 choice
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('feedback-text')).toContainText('1 of 3 decisions made')

    // Partial state after 2 choices
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    await expect(page.getByTestId('feedback-text')).toContainText('2 of 3 decisions made')

    // Complete state
    await page.getByTestId('step-dropdown-trigger-0-2').click()
    await page.getByTestId('dropdown-option-0-2-postgresql').click()
    await expect(page.getByTestId('feedback-text')).toContainText('All decisions made')
    await expect(page.getByTestId('feedback-banner')).toHaveClass(/feedback-banner-complete/)
  })

  test('compare modal shows optimal comparison of all options', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('compare-all-button').click()

    // All 3 steps should be in the comparison
    await expect(page.getByTestId('compare-step-0')).toBeVisible()
    await expect(page.getByTestId('compare-step-1')).toBeVisible()
    await expect(page.getByTestId('compare-step-2')).toBeVisible()

    // Each step should show all choice cards with pros/cons
    await expect(page.getByTestId('compare-card-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-next-ssr')).toBeVisible()
    await expect(page.getByTestId('compare-pros-0-react-spa')).toBeVisible()
    await expect(page.getByTestId('compare-cons-0-react-spa')).toBeVisible()

    // Step 1 choices
    await expect(page.getByTestId('compare-card-1-microservices')).toBeVisible()
    await expect(page.getByTestId('compare-card-1-modular-monolith')).toBeVisible()

    // Step 2 choices
    await expect(page.getByTestId('compare-card-2-postgresql')).toBeVisible()
    await expect(page.getByTestId('compare-card-2-mongo')).toBeVisible()
  })

  // ─── Cross-Scenario Validation ────────────────────────────────────────

  test('each scenario has distinct metrics that reset independently', async ({ page }) => {
    await page.goto(baseUrl)

    // Enterprise: performance/scalability/complexity/cost
    await expect(page.getByTestId('metric-bar-performance')).toBeVisible()
    await expect(page.getByTestId('metric-bar-scalability')).toBeVisible()

    // Switch to Real-Time: latency/consistency/devex/ops-cost
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()
    await expect(page.getByTestId('metric-bar-latency')).toBeVisible()
    await expect(page.getByTestId('metric-bar-consistency')).toBeVisible()
    await expect(page.getByTestId('metric-bar-devex')).toBeVisible()
    await expect(page.getByTestId('metric-bar-ops-cost')).toBeVisible()

    // Switch to Financial: security/compliance/maintainability/time-market
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'High-Security Financial Auditing Platform' }).click()
    await expect(page.getByTestId('metric-bar-security')).toBeVisible()
    await expect(page.getByTestId('metric-bar-compliance')).toBeVisible()
    await expect(page.getByTestId('metric-bar-maintainability')).toBeVisible()
    await expect(page.getByTestId('metric-bar-time-market')).toBeVisible()
  })

  test('metric bars reflect direction-aware coloring per scenario', async ({ page }) => {
    await page.goto(baseUrl)

    // In Enterprise, complexity has direction=lower
    // Placing microservices increases complexity -> red
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    const complexFill = page.getByTestId('metric-fill-complexity')
    const redBg = await complexFill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(redBg).toMatch(/rgb\(231, 130, 132\)/)

    // Placing modular-monolith decreases complexity -> green
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-modular-monolith').click()
    const greenBg = await complexFill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(greenBg).toMatch(/rgb\(166, 209, 137\)/)
  })

  // ─── Dropdown Selection Edge Cases ────────────────────────────────────────

  test('selecting same option replaces existing choice', async ({ page }) => {
    await page.goto(baseUrl)

    // First select react-spa
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')

    // Select next-ssr
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-next-ssr').click()

    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('Next.js SSR')
  })

  test('metrics accumulate across steps', async ({ page }) => {
    await page.goto(baseUrl)

    // Select choice for step 0
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')

    // Select choice for step 1
    await page.getByTestId('step-dropdown-trigger-0-1').click()
    await page.getByTestId('dropdown-option-0-1-microservices').click()
    await expect(page.getByTestId('drop-zone-content-0-1')).toContainText('Microservices')
    await expect(page.getByTestId('metric-value-performance')).toHaveText('55')

    // Select choice for step 2
    await page.getByTestId('step-dropdown-trigger-0-2').click()
    await page.getByTestId('dropdown-option-0-2-postgresql').click()
    await expect(page.getByTestId('drop-zone-content-0-2')).toContainText('PostgreSQL')
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')

    await expect(page.getByTestId('progress-indicator')).toHaveText('3 / 3')
  })

  // ─── Issue #35: Horizontal Layout & Dashed Cards ─────────────────

  test('steps-panel uses horizontal layout', async ({ page }) => {
    await page.goto(baseUrl)

    const stepsPanel = page.getByTestId('steps-panel')
    const display = await stepsPanel.evaluate((el) => getComputedStyle(el).display)
    expect(display).toBe('flex')

    const flexDirection = await stepsPanel.evaluate((el) => getComputedStyle(el).flexDirection)
    expect(flexDirection).toBe('row')

    const flexWrap = await stepsPanel.evaluate((el) => getComputedStyle(el).flexWrap)
    expect(flexWrap).toBe('nowrap')

    const overflowX = await stepsPanel.evaluate((el) => getComputedStyle(el).overflowX)
    expect(overflowX).toBe('auto')
  })

  test('unselected TradeoffStep cards have dashed outline', async ({ page }) => {
    await page.goto(baseUrl)

    // All three steps should be unselected initially
    await expect(page.getByTestId('step-section-0-0')).toHaveClass(/step-section-unselected/)
    await expect(page.getByTestId('step-section-0-1')).toHaveClass(/step-section-unselected/)
    await expect(page.getByTestId('step-section-0-2')).toHaveClass(/step-section-unselected/)

    // Verify dashed border style
    const step1 = page.getByTestId('step-section-0-0')
    const borderStyle = await step1.evaluate((el) => getComputedStyle(el).borderStyle)
    expect(borderStyle).toBe('dashed')
  })

  test('selected TradeoffStep card loses dashed outline', async ({ page }) => {
    await page.goto(baseUrl)

    // Initially dashed
    await expect(page.getByTestId('step-section-0-0')).toHaveClass(/step-section-unselected/)

    // Select a choice
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()

    // Should no longer have dashed class
    await expect(page.getByTestId('step-section-0-0')).not.toHaveClass(/step-section-unselected/)

    // Border should be solid
    const step1 = page.getByTestId('step-section-0-0')
    const borderStyle = await step1.evaluate((el) => getComputedStyle(el).borderStyle)
    expect(borderStyle).toBe('solid')
  })

  test('step cards are fixed-width compact cards', async ({ page }) => {
    await page.goto(baseUrl)

    const step1 = page.getByTestId('step-section-0-0')
    const width = await step1.evaluate((el) => getComputedStyle(el).width)
    expect(width).toBe('320px')

    const flexShrink = await step1.evaluate((el) => getComputedStyle(el).flexShrink)
    expect(flexShrink).toBe('0')
  })

  test('horizontal layout preserves step order', async ({ page }) => {
    await page.goto(baseUrl)

    // Wait for tradeoff sandbox section to render
    await expect(page.getByTestId('tradeoff-sandbox')).toBeVisible()

    const steps = page.locator('[data-testid^="step-section-0-"]')
    const count = await steps.count()
    expect(count).toBe(3)

    // Verify order
    await expect(steps.nth(0)).toContainText('Frontend Framework')
    await expect(steps.nth(1)).toContainText('Backend Architecture')
    await expect(steps.nth(2)).toContainText('Data Storage')
  })

  test('horizontal scroll works at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    const stepsPanel = page.getByTestId('steps-panel')
    const scrollWidth = await stepsPanel.evaluate((el) => el.scrollWidth)
    const clientWidth = await stepsPanel.evaluate((el) => el.clientWidth)

    // Total content width should exceed viewport, requiring horizontal scroll
    expect(scrollWidth).toBeGreaterThan(clientWidth)

    // All step sections should still be visible (scrollable)
    await expect(page.getByTestId('step-section-0-0')).toBeVisible()
    await expect(page.getByTestId('step-section-0-1')).toBeVisible()
    await expect(page.getByTestId('step-section-0-2')).toBeVisible()
  })

  test('removing choice restores dashed outline', async ({ page }) => {
    await page.goto(baseUrl)

    // Select then remove
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('step-section-0-0')).not.toHaveClass(/step-section-unselected/)

    await page.getByTestId('drop-zone-remove-0-0').click()
    await expect(page.getByTestId('step-section-0-0')).toHaveClass(/step-section-unselected/)
  })

  // ─── Issue #36: Info Icon & Details Modal ─────────────────

  test('placed step cards render an info icon', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()

    await expect(page.getByTestId('drop-zone-info-0-0')).toBeVisible()
  })

  test('clicking info icon opens details modal', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('drop-zone-info-0-0').click()

    await expect(page.getByTestId('details-dialog')).toBeVisible()
    await expect(page.getByTestId('details-overlay')).toBeVisible()
  })

  test('details modal shows choice label, description, pros, cons', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('drop-zone-info-0-0').click()

    await expect(page.getByTestId('details-choice-label')).toContainText('React SPA')
    await expect(page.getByTestId('details-description')).toBeVisible()
    await expect(page.getByTestId('details-pros')).toBeVisible()
    await expect(page.getByTestId('details-cons')).toBeVisible()
  })

  test('details modal shows detailed pros with title and description', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('drop-zone-info-0-0').click()

    const firstPro = page.getByTestId('details-pro-0')
    await expect(firstPro).toBeVisible()
    await expect(firstPro).toContainText('Rich ecosystem')
    await expect(firstPro).toContainText('Vast library support and community')
  })

  test('details modal shows detailed cons with title and description', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('drop-zone-info-0-0').click()

    const firstCon = page.getByTestId('details-con-0')
    await expect(firstCon).toBeVisible()
    await expect(firstCon).toContainText('SEO challenges')
    await expect(firstCon).toContainText('Requires SSR or SSG for search indexing')
  })

  test('details modal shows recommendation box for recommended choice', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-next-ssr').click()
    await page.getByTestId('drop-zone-info-0-0').click()

    await expect(page.getByTestId('details-recommended-badge')).toBeVisible()
    await expect(page.getByTestId('details-recommendation-box')).toBeVisible()
    await expect(page.getByTestId('details-rec-text')).toBeVisible()
  })

  test('details modal shows alternative box for non-recommended choice', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('drop-zone-info-0-0').click()

    await expect(page.getByTestId('details-alternative-box')).toBeVisible()
    await expect(page.getByTestId('details-alt-text')).toBeVisible()
  })

  test('details modal dismissible with Escape key', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('drop-zone-info-0-0').click()
    await expect(page.getByTestId('details-dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('details-dialog')).not.toBeVisible()
  })

  test('details modal dismissible with close button', async ({ page }) => {
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await page.getByTestId('drop-zone-info-0-0').click()
    await expect(page.getByTestId('details-dialog')).toBeVisible()

    await page.getByTestId('details-dialog-close').click()
    await expect(page.getByTestId('details-dialog')).not.toBeVisible()
  })
})

test.describe('Issue #37: Compact Metric Dashboard & Galaxy Z Fold 7 Viewport Optimization', () => {
  const baseUrl = '/#/demo/ai-agent'

  // ─── Folded cover screen (344x800) ─────────────────────────────

  test('Galaxy Z Fold 7 folded: dashboard sticky at top with compact layout', async ({ page }) => {
    await page.setViewportSize({ width: 344, height: 800 })
    await page.goto(baseUrl)

    // Dashboard visible and sticky at top
    await expect(page.getByTestId('metric-dashboard')).toBeVisible()
    const dashboard = page.getByTestId('metric-dashboard')
    const dashStyle = await dashboard.evaluate((el) => ({
      position: getComputedStyle(el).position,
      top: getComputedStyle(el).top,
    }))
    expect(dashStyle.position).toBe('sticky')
    expect(dashStyle.top).toBe('0px')

    // All metric bars visible in compact layout
    await expect(page.getByTestId('metric-bar-performance')).toBeVisible()
    await expect(page.getByTestId('metric-bar-scalability')).toBeVisible()
    await expect(page.getByTestId('metric-bar-complexity')).toBeVisible()
    await expect(page.getByTestId('metric-bar-cost')).toBeVisible()

    // Progress indicator visible
    await expect(page.getByTestId('progress-indicator')).toBeVisible()
  })

  test('Galaxy Z Fold 7 folded: metrics wrap into rows at narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 344, height: 800 })
    await page.goto(baseUrl)

    // metric-bars should allow wrapping
    const metricBars = page.getByTestId('metric-bars')
    const barsStyle = await metricBars.evaluate((el) => ({
      flexWrap: getComputedStyle(el).flexWrap,
    }))
    expect(barsStyle.flexWrap).toBe('wrap')

    // All metrics still visible
    await expect(page.getByTestId('metric-label-performance')).toBeVisible()
    await expect(page.getByTestId('metric-value-performance')).toBeVisible()
  })

  test('Galaxy Z Fold 7 folded: step cards scroll horizontally below sticky dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 344, height: 800 })
    await page.goto(baseUrl)

    // Steps panel horizontal scroll
    const stepsPanel = page.getByTestId('steps-panel')
    const scrollWidth = await stepsPanel.evaluate((el) => el.scrollWidth)
    const clientWidth = await stepsPanel.evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeGreaterThan(clientWidth)

    // Dashboard above steps panel
    const dashBox = await page.getByTestId('metric-dashboard').boundingBox()
    const stepsBox = await stepsPanel.boundingBox()
    expect(dashBox?.y).toBeLessThan(stepsBox?.y)

    // First step visible, remaining steps reachable via scroll
    await expect(page.getByTestId('step-section-0-0')).toBeVisible()
  })

  test('Galaxy Z Fold 7 folded: dropdown selection works at narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 344, height: 800 })
    await page.goto(baseUrl)

    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')
  })

  test('Galaxy Z Fold 7 folded: no visual overlap or clipping', async ({ page }) => {
    await page.setViewportSize({ width: 344, height: 800 })
    await page.goto(baseUrl)

    // Dashboard dimensions fit within viewport
    const dashBox = await page.getByTestId('metric-dashboard').boundingBox()
    expect(dashBox?.width).toBeLessThanOrEqual(344)
    expect(dashBox?.x).toBeGreaterThanOrEqual(0)

    // All key elements visible and within viewport bounds
    await expect(page.getByTestId('scenario-select')).toBeVisible()
    await expect(page.getByTestId('scenario-banner')).toBeVisible()
    await expect(page.getByTestId('feedback-banner')).toBeVisible()
    await expect(page.getByTestId('compare-all-button')).toBeVisible()
  })

  // ─── Unfolded screen (768x1024) ─────────────────────────────

  test('Galaxy Z Fold 7 unfolded: full sticky dashboard with horizontal step cards', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    // Wait for sandbox to render
    await expect(page.getByTestId('tradeoff-sandbox')).toBeVisible()

    // Dashboard visible, sticky, full width
    await expect(page.getByTestId('metric-dashboard')).toBeVisible()
    const dashboard = page.getByTestId('metric-dashboard')
    const dashStyle = await dashboard.evaluate((el) => ({
      position: getComputedStyle(el).position,
      top: getComputedStyle(el).top,
    }))
    expect(dashStyle.position).toBe('sticky')
    expect(dashStyle.top).toBe('0px')

    // Dashboard spans near full width
    const dashBox = await dashboard.boundingBox()
    expect(dashBox?.width).toBeGreaterThan(600)

    // Steps panel horizontal scroll
    const stepsPanel = page.getByTestId('steps-panel')
    await expect(stepsPanel).toBeVisible()
    const scrollWidth = await stepsPanel.evaluate((el) => el.scrollWidth)
    const clientWidth = await stepsPanel.evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeGreaterThan(clientWidth)
  })

  test('Galaxy Z Fold 7 unfolded: metrics displayed horizontally in single row', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    // metric-bars should NOT wrap at unfolded width
    const metricBars = page.getByTestId('metric-bars')
    const barsStyle = await metricBars.evaluate((el) => ({
      flexWrap: getComputedStyle(el).flexWrap,
    }))
    expect(barsStyle.flexWrap).toBe('nowrap')

    // All 4 metrics visible in the row
    await expect(page.getByTestId('metric-bar-performance')).toBeVisible()
    await expect(page.getByTestId('metric-bar-scalability')).toBeVisible()
    await expect(page.getByTestId('metric-bar-complexity')).toBeVisible()
    await expect(page.getByTestId('metric-bar-cost')).toBeVisible()
  })

  test('Galaxy Z Fold 7 unfolded: no visual overlap or clipping', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    // Dashboard dimensions fit within viewport
    const dashBox = await page.getByTestId('metric-dashboard').boundingBox()
    expect(dashBox?.width).toBeLessThanOrEqual(768)
    expect(dashBox?.x).toBeGreaterThanOrEqual(0)

    // All key elements visible
    await expect(page.getByTestId('scenario-select')).toBeVisible()
    await expect(page.getByTestId('scenario-banner')).toBeVisible()
    await expect(page.getByTestId('feedback-banner')).toBeVisible()
    await expect(page.getByTestId('compare-all-button')).toBeVisible()
    await expect(page.getByTestId('step-section-0-0')).toBeVisible()
    await expect(page.getByTestId('step-section-0-1')).toBeVisible()
    await expect(page.getByTestId('step-section-0-2')).toBeVisible()
  })

  test('Galaxy Z Fold 7 unfolded: step cards maintain full width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    const step1 = page.getByTestId('step-section-0-0')
    const width = await step1.evaluate((el) => getComputedStyle(el).width)
    expect(width).toBe('320px')
  })

  test('Galaxy Z Fold 7 unfolded: interaction works cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    // Wait for sandbox to render
    await expect(page.getByTestId('tradeoff-sandbox')).toBeVisible()

    // Dropdown selection
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await expect(page.getByTestId('step-dropdown-menu-0-0')).toBeVisible()
    await page.getByTestId('dropdown-option-0-0-next-ssr').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('Next.js SSR')

    // Metric updates
    await expect(page.getByTestId('metric-value-performance')).toHaveText('65')

    // Scenario switch
    await page.getByTestId('scenario-select').click()
    await page.getByRole('option', { name: 'Real-Time Chat & Collab System' }).click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('0 / 3')
  })
})
