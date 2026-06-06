import { test, expect } from '@playwright/test'

test.describe('Issue #25: TradeoffSandbox Testing Suite', () => {
  const baseUrl = '/#/demo/ai-agent'

  // ─── Reset to Optimal State ─────────────────────────────────────

  test('reset to optimal state removes all choices and restores base metrics', async ({ page }) => {
    await page.goto(baseUrl)

    // Place choices in all 3 steps
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await page.getByTestId('choice-card-0-1-microservices').click()
    await page.getByTestId('choice-card-0-2-postgresql').click()

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
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await page.getByTestId('choice-card-0-1-microservices').click()
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

  test('reset preserves choice cards as draggable after removal', async ({ page }) => {
    await page.goto(baseUrl)

    // Place and remove a choice
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('choice-placed-badge-0-0-react-spa')).toBeVisible()
    await page.getByTestId('drop-zone-remove-0-0').click()

    // Card should be draggable again
    const card = page.getByTestId('choice-card-0-0-react-spa')
    const draggable = await card.getAttribute('draggable')
    expect(draggable).toBe('true')
    await expect(card).toHaveAttribute('role', 'button')
    const tabindex = await card.getAttribute('tabindex')
    expect(tabindex).toBe('0')
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

  test('choice cards and drop zones remain interactive at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(baseUrl)

    // Click-to-drop should work
    await page.getByTestId('choice-card-0-0-react-spa').click()
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

    await page.getByTestId('choice-card-0-0-react-spa').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('drop-zone-content-0-0')).toBeVisible()
  })

  test('large desktop viewport maintains layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(baseUrl)

    // Side-by-side layout: metric dashboard and steps panel
    const dashboard = page.getByTestId('metric-dashboard')
    const stepsPanel = page.getByTestId('steps-panel')
    await expect(dashboard).toBeVisible()
    await expect(stepsPanel).toBeVisible()

    // Both should have reasonable dimensions
    const dashBox = await dashboard.boundingBox()
    const stepsBox = await stepsPanel.boundingBox()
    expect(dashBox?.width).toBeGreaterThan(200)
    expect(stepsBox?.width).toBeGreaterThan(200)
  })

  // ─── Validation Feedback: Optimal Process Comparison ───────────────

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
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('feedback-text')).toContainText('1 of 3 decisions made')

    // Partial state after 2 choices
    await page.getByTestId('choice-card-0-1-microservices').click()
    await expect(page.getByTestId('feedback-text')).toContainText('2 of 3 decisions made')

    // Complete state
    await page.getByTestId('choice-card-0-2-postgresql').click()
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
    await page.getByTestId('choice-card-0-1-microservices').click()
    const complexFill = page.getByTestId('metric-fill-complexity')
    const redBg = await complexFill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(redBg).toMatch(/rgb\(231, 130, 132\)/)

    // Placing modular-monolith decreases complexity -> green
    await page.getByTestId('choice-card-0-1-modular-monolith').click()
    const greenBg = await complexFill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(greenBg).toMatch(/rgb\(166, 209, 137\)/)
  })

  // ─── Drag and Drop Edge Cases ─────────────────────────────────────────

  test('drag and drop replaces existing choice in drop zone', async ({ page }) => {
    await page.goto(baseUrl)

    // First place react-spa
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')

    // Then drag next-ssr to the same drop zone
    const card = page.getByTestId('choice-card-0-0-next-ssr')
    const dropZone = page.getByTestId('drop-zone-0-0')
    await card.dragTo(dropZone)

    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('Next.js SSR')
    await expect(page.getByTestId('choice-placed-badge-0-0-next-ssr')).toBeVisible()
    await expect(page.getByTestId('choice-placed-badge-0-0-react-spa')).not.toBeVisible()
  })

  test('drag and drop accumulates metrics across steps', async ({ page }) => {
    await page.goto(baseUrl)

    // Drag choice to step 0
    await page.getByTestId('choice-card-0-0-react-spa').dragTo(page.getByTestId('drop-zone-0-0'))
    await expect(page.getByTestId('drop-zone-content-0-0')).toContainText('React SPA')
    await expect(page.getByTestId('metric-value-performance')).toHaveText('60')

    // Use click-to-drop for step 1 (more reliable across steps)
    await page.getByTestId('choice-card-0-1-microservices').click()
    await expect(page.getByTestId('drop-zone-content-0-1')).toContainText('Microservices')
    await expect(page.getByTestId('metric-value-performance')).toHaveText('55')

    // Use click-to-drop for step 2
    await page.getByTestId('choice-card-0-2-postgresql').click()
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
    await page.getByTestId('choice-card-0-0-react-spa').click()

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
    await page.getByTestId('choice-card-0-0-react-spa').click()
    await expect(page.getByTestId('step-section-0-0')).not.toHaveClass(/step-section-unselected/)

    await page.getByTestId('drop-zone-remove-0-0').click()
    await expect(page.getByTestId('step-section-0-0')).toHaveClass(/step-section-unselected/)
  })
})
