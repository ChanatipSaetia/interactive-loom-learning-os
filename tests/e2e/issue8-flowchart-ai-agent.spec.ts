import { test, expect } from '@playwright/test'

test.describe('Issue #8: Flowchart Section + AI Agent Topic', () => {
  test('navigates to AI Agent topic and shows flowchart', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const topic = page.getByTestId('demo-topic')
    await expect(topic).toBeVisible()
  })

  test('renders flowchart SVG with all nodes visible', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const svg = page.getByTestId('flowchart-svg-EVENT_STORMING')
    await expect(svg).toBeVisible()

    const userNode = page.getByTestId('flowchart-node-EVENT_STORMING-user')
    await expect(userNode).toBeVisible()

    const orchestratorNode = page.getByTestId('flowchart-node-EVENT_STORMING-orch_agent')
    await expect(orchestratorNode).toBeVisible()

    const llmNode = page.getByTestId('flowchart-node-EVENT_STORMING-llm_reason_ref')
    await expect(llmNode).toBeVisible()

    const toolsNode = page.getByTestId('flowchart-node-EVENT_STORMING-tools_ref')
    await expect(toolsNode).toBeVisible()


  })

  test('renders all edges connecting nodes', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const svg = page.getByTestId('flowchart-svg-EVENT_STORMING')
    await expect(svg.locator('g[data-testid^="flowchart-edge-"] path').first()).toBeAttached()
  })

  test('renders flowchart title', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    const title = page.getByTestId('flowchart-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('AI Agent Architecture')
  })

  test('renders node labels and stereotypes', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await expect(page.getByTestId('flowchart-node-EVENT_STORMING-user').getByText('User').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('flowchart-node-EVENT_STORMING-user').getByText('Actor').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('flowchart-node-EVENT_STORMING-orch_agent').getByText('Agent Orchestrator').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('flowchart-node-EVENT_STORMING-orch_agent').getByText('Aggregate').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('flowchart-node-EVENT_STORMING-llm_reason_ref').getByText('LLM Engine').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('flowchart-node-EVENT_STORMING-llm_reason_ref').getByText('External API').filter({ visible: true })).toBeVisible()
  })
})
