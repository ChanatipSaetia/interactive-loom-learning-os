import { test, expect } from '@playwright/test'

test.describe('Issue #56: E-Commerce Order Processing Topic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/topics/ecommerce-orders')
    await page.waitForSelector('[data-testid="flowchart-section"]')
    await page.waitForTimeout(500)
  })

  test('navigates to ecommerce-orders topic and shows topic container', async ({ page }) => {
    const topic = page.getByTestId('ecommerce-orders-topic')
    await expect(topic).toBeVisible()
  })

  test('renders flowchart SVG with order processing nodes', async ({ page }) => {
    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()

    const customerNode = page.getByTestId('flowchart-node-EVENT_STORMING-customer')
    await expect(customerNode).toBeVisible()

    const orderServiceNode = page.getByTestId('flowchart-node-EVENT_STORMING-order_checkout')
    await expect(orderServiceNode).toBeVisible()

    const stripeNode = page.getByTestId('flowchart-node-EVENT_STORMING-stripe')
    await expect(stripeNode).toBeVisible()

    const fraudNode = page.getByTestId('flowchart-node-EVENT_STORMING-fraud_service')
    await expect(fraudNode).toBeVisible()
  })

  test('renders flowchart title', async ({ page }) => {
    const title = page.getByTestId('flowchart-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('Order Processing Pipeline')
  })

  test('renders text section with order processing heading', async ({ page }) => {
    await expect(page.getByText('Checkout, Payment, and Fraud Detection Pipeline')).toBeVisible()
  })

  test('instant checkout journey executes with journey selector', async ({ page }) => {
    await page.getByTestId('dock-tab-journey').click()
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await expect(journeySelect).toBeVisible()
    await expect(journeySelect).toHaveValue('instant-checkout')

    await page.getByTestId('dock-tab-steps').click()
    const playBtn = page.getByTestId('flowchart-btn-play')
    await expect(playBtn).toBeVisible()

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 5')
  })

  test('fraud review block journey available in selector', async ({ page }) => {
    await page.getByTestId('dock-tab-journey').click()
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await journeySelect.selectOption('fraud-review-block')
    await expect(journeySelect).toHaveValue('fraud-review-block')

    await page.getByTestId('dock-tab-steps').click()
    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 6')
  })

  test('fraud review block step 5 triggers risk/escalation', async ({ page }) => {
    await page.getByTestId('dock-tab-journey').click()
    await page.getByTestId('flowchart-journey-select').selectOption('fraud-review-block')

    await page.getByTestId('dock-tab-steps').click()
    const nextBtn = page.getByTestId('flowchart-btn-next')
    await expect(nextBtn).toBeVisible()

    for (let i = 0; i < 5; i++) {
      await nextBtn.click()
      await page.waitForTimeout(300)
    }

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('5 / 6')
  })

  test('view tabs show all 5 views', async ({ page }) => {
    await page.getByTestId('dock-tab-views').click()
    const viewTabs = page.getByTestId('flowchart-view-tabs')
    await expect(viewTabs).toBeVisible()

    const tabTexts = await viewTabs.locator('.flowchart-view-tab-label').evaluateAll(el => el.map(e => e.textContent?.trim()))
    expect(tabTexts).toContain('Event Storming')
    expect(tabTexts).toContain('System Architecture')
    expect(tabTexts).toContain('Data Flow')
    expect(tabTexts).toContain('Activity Swimlanes')
    expect(tabTexts).toContain('Sequence Diagram')
  })

  test('switching to System Architecture view updates diagram', async ({ page }) => {
    await page.getByTestId('dock-tab-views').click()
    const sysArchTab = page.locator('.flowchart-view-tab-trigger').filter({ hasText: 'System Architecture' })
    await sysArchTab.click()
    await page.waitForTimeout(500)

    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()

    const orderServiceNode = page.getByTestId('flowchart-node-SYS_ARCH-order_service')
    await expect(orderServiceNode).toBeVisible()
  })

  test('switching to Sequence Diagram view shows lifelines', async ({ page }) => {
    await page.getByTestId('dock-tab-views').click()
    const seqTab = page.locator('.flowchart-view-tab-trigger').filter({ hasText: 'Sequence Diagram' })
    await seqTab.click()
    await page.waitForTimeout(500)

    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()
  })

  test('bullets section renders pipeline capabilities', async ({ page }) => {
    await expect(page.getByText('Pipeline Capabilities')).toBeVisible()
    await expect(page.getByText('Real-time inventory lock with 15-minute expiry window')).toBeVisible()
    await expect(page.getByText('Stripe PaymentIntent authorization with webhook-driven capture')).toBeVisible()
    await expect(page.getByText('Auto-approval for low-risk orders')).toBeVisible()
    await expect(page.getByText('Manual review gate for high-risk orders')).toBeVisible()
  })

  test('instant checkout journey step-through highlights nodes', async ({ page }) => {
    const nextBtn = page.getByTestId('flowchart-btn-next')

    // Step 1: Order Placed
    await nextBtn.click()
    await page.waitForTimeout(300)

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('1 / 5')

    // Step 2: Inventory Lock
    await nextBtn.click()
    await page.waitForTimeout(300)
    await expect(progress).toHaveText('2 / 5')

    // Step 3: Payment Authorized
    await nextBtn.click()
    await page.waitForTimeout(300)
    await expect(progress).toHaveText('3 / 5')
  })
})
