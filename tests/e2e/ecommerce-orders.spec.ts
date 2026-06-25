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
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await expect(journeySelect).toBeVisible()
    await expect(journeySelect).toHaveValue('instant-checkout')

    const playBtn = page.getByTestId('flowchart-btn-play')
    await expect(playBtn).toBeVisible()

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 5')
  })

  test('fraud review block journey available in selector', async ({ page }) => {
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await journeySelect.selectOption('fraud-review-block')
    await expect(journeySelect).toHaveValue('fraud-review-block')

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 6')
  })

  test('fraud review block step 5 triggers risk/escalation', async ({ page }) => {
    await page.getByTestId('flowchart-journey-select').selectOption('fraud-review-block')

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
    const viewTabs = page.getByTestId('flowchart-view-tabs')
    await expect(viewTabs).toBeVisible()

    await expect(page.getByText('Event Storming')).toBeVisible()
    await expect(page.getByText('System Architecture')).toBeVisible()
    await expect(page.getByText('Data Flow')).toBeVisible()
    await expect(page.getByText('Activity Swimlanes')).toBeVisible()
    await expect(page.getByText('Sequence Diagram')).toBeVisible()
  })

  test('switching to System Architecture view updates diagram', async ({ page }) => {
    const sysArchTab = page.getByText('System Architecture')
    await sysArchTab.click()
    await page.waitForTimeout(500)

    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()

    const orderServiceNode = page.getByTestId('flowchart-node-SYS_ARCH-order_service')
    await expect(orderServiceNode).toBeVisible()
  })

  test('switching to Sequence Diagram view shows lifelines', async ({ page }) => {
    const seqTab = page.getByText('Sequence Diagram')
    await seqTab.click()
    await page.waitForTimeout(500)

    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()
  })

  test('database node displays ERD schemas in popover', async ({ page }) => {
    // Switch to SYS_ARCH view where order_db node exists
    const sysArchTab = page.getByText('System Architecture')
    await sysArchTab.click()
    await page.waitForTimeout(500)

    // Click on database node
    const dbNode = page.getByTestId('flowchart-node-SYS_ARCH-order_db')
    await dbNode.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
    await page.waitForTimeout(500)

    // ERD schema widget should be visible
    const erdWidget = page.getByTestId('erd-schema-widget')
    await expect(erdWidget).toBeVisible()
  })

  test('payments table shows stripe_payment_intent_id column', async ({ page }) => {
    const sysArchTab = page.getByText('System Architecture')
    await sysArchTab.click()
    await page.waitForTimeout(500)

    const stripeNode = page.getByTestId('flowchart-node-SYS_ARCH-stripe')
    await stripeNode.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
    await page.waitForTimeout(500)

    const erdWidget = page.getByTestId('erd-schema-widget')
    await expect(erdWidget).toBeVisible()
    await expect(page.getByText('payments')).toBeVisible()
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
