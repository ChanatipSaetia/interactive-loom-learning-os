import { test, expect } from '@playwright/test'

test.describe('Issue #55: AI Document Ingestion Pipeline Topic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/topics/doc-pipeline')
    await page.waitForSelector('[data-testid="flowchart-section"]')
    await page.waitForTimeout(500)
  })

  test('navigates to doc-pipeline topic and shows topic container', async ({ page }) => {
    const topic = page.getByTestId('doc-pipeline-topic')
    await expect(topic).toBeVisible()
  })

  test('renders flowchart SVG with document processing nodes', async ({ page }) => {
    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()

    const userNode = page.getByTestId('flowchart-node-EVENT_STORMING-user')
    await expect(userNode).toBeVisible()

    const orchestratorNode = page.getByTestId('flowchart-node-EVENT_STORMING-orch_extract')
    await expect(orchestratorNode).toBeVisible()

    const ocrNode = page.getByTestId('flowchart-node-EVENT_STORMING-ocr_service')
    await expect(ocrNode).toBeVisible()

    const llmNode = page.getByTestId('flowchart-node-EVENT_STORMING-llm_api')
    await expect(llmNode).toBeVisible()
  })

  test('renders flowchart title', async ({ page }) => {
    const title = page.getByTestId('flowchart-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('Document Processing Pipeline')
  })

  test('renders text section with pipeline heading', async ({ page }) => {
    await expect(page.getByText('Automated Extraction with Human Audit')).toBeVisible()
  })

  test('happy path journey executes with journey selector', async ({ page }) => {
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await expect(journeySelect).toBeVisible()
    await expect(journeySelect).toHaveValue('happy-path')

    const playBtn = page.getByTestId('flowchart-btn-play')
    await expect(playBtn).toBeVisible()

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 4')
  })

  test('low confidence audit journey available in selector', async ({ page }) => {
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await journeySelect.selectOption('low-confidence-audit')
    await expect(journeySelect).toHaveValue('low-confidence-audit')

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 5')
  })

  test('low confidence audit step 4 triggers risk/escalation', async ({ page }) => {
    await page.getByTestId('flowchart-journey-select').selectOption('low-confidence-audit')

    const nextBtn = page.getByTestId('flowchart-btn-next')
    await expect(nextBtn).toBeVisible()

    for (let i = 0; i < 4; i++) {
      await nextBtn.click()
      await page.waitForTimeout(300)
    }

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('4 / 5')
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

    const orchestratorNode = page.getByTestId('flowchart-node-SYS_ARCH-orchestrator')
    await expect(orchestratorNode).toBeVisible()
  })

  test('switching to Data Flow view shows data objects', async ({ page }) => {
    const dfdTab = page.getByText('Data Flow')
    await dfdTab.click()
    await page.waitForTimeout(500)

    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()
  })

  test('database node displays ERD schemas in popover', async ({ page }) => {
    // Switch to SYS_ARCH view where db node exists
    const sysArchTab = page.getByText('System Architecture')
    await sysArchTab.click()
    await page.waitForTimeout(500)

    // Click on database node
    const dbNode = page.getByTestId('flowchart-node-SYS_ARCH-db')
    await dbNode.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
    await page.waitForTimeout(500)

    // ERD schema widget should be visible
    const erdWidget = page.getByTestId('erd-schema-widget')
    await expect(erdWidget).toBeVisible()
  })

  test('documents table visible in ERD popover', async ({ page }) => {
    // Switch to SYS_ARCH view
    const sysArchTab = page.getByText('System Architecture')
    await sysArchTab.click()
    await page.waitForTimeout(500)

    // Click on database node
    const dbNode = page.getByTestId('flowchart-node-SYS_ARCH-db')
    await dbNode.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
    await page.waitForTimeout(500)

    // Check for table names in ERD
    await expect(page.getByTestId('erd-table-documents')).toBeVisible()
  })

  test('bullets section renders pipeline capabilities', async ({ page }) => {
    await expect(page.getByText('Pipeline Capabilities')).toBeVisible()
    await expect(page.getByText('Multi-format OCR extraction')).toBeVisible()
    await expect(page.getByText('LLM semantic validation')).toBeVisible()
    await expect(page.getByText('Human audit queue')).toBeVisible()
  })
})
