import { test, expect, type Page } from '@playwright/test'

const flowchart = (page: Page) => page.getByTestId('flowchart-section').first()

test.describe('Issue #69: Policy only maps to Decision when branching (2+ outgoing)', () => {
  test('linear Policy nodes appear in EVENT_STORMING but not in SWIMLANES', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    
    // Scroll to the flowchart section
    const flowchartSection = flowchart(page)
    await expect(flowchartSection).toBeVisible({ timeout: 15000 })

    // Verify Policy node appears in EVENT_STORMING view
    const polDefineEs = flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-pol_run_agent')
    await expect(polDefineEs).toBeVisible()

    // Switch to SWIMLANES view
    const swimlanesTab = flowchart(page).locator('.flowchart-view-tab-trigger').filter({ hasText: 'Activity Swimlanes' })
    await swimlanesTab.click()

    // Linear Policy should NOT appear in SWIMLANES
    const polDefineSwim = flowchart(page).getByTestId('flowchart-node-SWIMLANES-pol_run_agent')
    await expect(polDefineSwim).not.toBeVisible()

    // Verify the SWIMLANES view still renders other nodes
    const swimNodes = flowchart(page).locator('[data-testid^="flowchart-node-SWIMLANES-"]')
    await expect.poll(() => swimNodes.count()).toBeGreaterThan(0)
  })

  test('linear Policy nodes appear in EVENT_STORMING but not in DATA_FLOW', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const flowchartSection = flowchart(page)
    await expect(flowchartSection).toBeVisible({ timeout: 15000 })

    // Verify Policy node in EVENT_STORMING
    const polPersistEs = flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-pol_call_llm')
    await expect(polPersistEs).toBeVisible()

    // Switch to DATA_FLOW view
    const dataFlowTab = flowchart(page).locator('.flowchart-view-tab-trigger').filter({ hasText: 'Data Flow' })
    await dataFlowTab.click()

    // Linear Policy should NOT appear in DATA_FLOW
    const polPersistDf = flowchart(page).getByTestId('flowchart-node-DATA_FLOW-pol_call_llm')
    await expect(polPersistDf).not.toBeVisible()

    // Verify the DATA_FLOW view still renders other nodes
    const dfNodes = flowchart(page).locator('[data-testid^="flowchart-node-DATA_FLOW-"]')
    await expect.poll(() => dfNodes.count()).toBeGreaterThan(0)
  })
})
