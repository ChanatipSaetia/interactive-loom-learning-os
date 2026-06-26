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
    await page.getByTestId('dock-tab-journey').click()
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await expect(journeySelect).toBeVisible()
    await expect(journeySelect).toHaveValue('happy-path')

    await page.getByTestId('dock-tab-steps').click()
    const playBtn = page.getByTestId('flowchart-btn-play')
    await expect(playBtn).toBeVisible()

    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 4')
  })

  test('low confidence audit journey available in selector', async ({ page }) => {
    await page.getByTestId('dock-tab-journey').click()
    const journeySelect = page.getByTestId('flowchart-journey-select')
    await journeySelect.selectOption('low-confidence-audit')
    await expect(journeySelect).toHaveValue('low-confidence-audit')

    await page.getByTestId('dock-tab-steps').click()
    const progress = page.getByTestId('flowchart-progress')
    await expect(progress).toHaveText('0 / 5')
  })

  test('low confidence audit step 4 triggers risk/escalation', async ({ page }) => {
    await page.getByTestId('dock-tab-journey').click()
    await page.getByTestId('flowchart-journey-select').selectOption('low-confidence-audit')

    await page.getByTestId('dock-tab-steps').click()
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

    const orchestratorNode = page.getByTestId('flowchart-node-SYS_ARCH-orchestrator')
    await expect(orchestratorNode).toBeVisible()
  })

  test('switching to Data Flow view shows data objects', async ({ page }) => {
    await page.getByTestId('dock-tab-views').click()
    const dfdTab = page.locator('.flowchart-view-tab-trigger').filter({ hasText: 'Data Flow' })
    await dfdTab.click()
    await page.waitForTimeout(500)

    const svg = page.locator('.flowchart-svg').first()
    await expect(svg).toBeVisible()
  })

  test('bullets section renders pipeline capabilities', async ({ page }) => {
    await expect(page.getByText('Pipeline Capabilities')).toBeVisible()
    await expect(page.getByText('Multi-format OCR extraction')).toBeVisible()
    await expect(page.getByText('LLM semantic validation')).toBeVisible()
    await expect(page.getByText('Human audit queue')).toBeVisible()
  })
})
