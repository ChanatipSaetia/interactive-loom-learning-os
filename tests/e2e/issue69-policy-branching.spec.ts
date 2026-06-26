import { test, expect } from '@playwright/test'

test.describe('Issue #69: Policy only maps to Decision when branching (2+ outgoing)', () => {
  test('linear Policy nodes appear in EVENT_STORMING but not in SWIMLANES', async ({ page }) => {
    await page.goto('/#/topics/ddd')
    
    // Scroll to the flowchart section
    const flowchartSection = page.getByTestId('flowchart-section')
    await expect(flowchartSection).toBeVisible({ timeout: 15000 })

    // Verify Policy node appears in EVENT_STORMING view
    const polDefineEs = page.getByTestId('flowchart-node-EVENT_STORMING-pol_define')
    await expect(polDefineEs).toBeVisible()

    // Switch to SWIMLANES view
    await page.getByTestId('dock-tab-views').click()
    const swimlanesTab = page.locator('.flowchart-view-tab-trigger').filter({ hasText: 'Activity Swimlanes' })
    await swimlanesTab.click()
    await page.waitForTimeout(500)

    // Linear Policy should NOT appear in SWIMLANES
    const polDefineSwim = page.getByTestId('flowchart-node-SWIMLANES-pol_define')
    await expect(polDefineSwim).not.toBeVisible()

    // Verify the SWIMLANES view still renders other nodes
    const swimNodes = page.locator('[data-testid^="flowchart-node-SWIMLANES-"]')
    await expect.poll(() => swimNodes.count()).toBeGreaterThan(0)
  })

  test('linear Policy nodes appear in EVENT_STORMING but not in DATA_FLOW', async ({ page }) => {
    await page.goto('/#/topics/ddd')

    const flowchartSection = page.getByTestId('flowchart-section')
    await expect(flowchartSection).toBeVisible({ timeout: 15000 })

    // Verify Policy node in EVENT_STORMING
    const polPersistEs = page.getByTestId('flowchart-node-EVENT_STORMING-pol_persist')
    await expect(polPersistEs).toBeVisible()

    // Switch to DATA_FLOW view
    await page.getByTestId('dock-tab-views').click()
    const dataFlowTab = page.locator('.flowchart-view-tab-trigger').filter({ hasText: 'Data Flow' })
    await dataFlowTab.click()
    await page.waitForTimeout(500)

    // Linear Policy should NOT appear in DATA_FLOW
    const polPersistDf = page.getByTestId('flowchart-node-DATA_FLOW-pol_persist')
    await expect(polPersistDf).not.toBeVisible()

    // Verify the DATA_FLOW view still renders other nodes
    const dfNodes = page.locator('[data-testid^="flowchart-node-DATA_FLOW-"]')
    await expect.poll(() => dfNodes.count()).toBeGreaterThan(0)
  })
})
