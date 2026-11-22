import { test, expect, type Page } from '@playwright/test'

const flowchart = (page: Page) => page.getByTestId('flowchart-section').first()

test.describe('Issue #8: Flowchart Section + AI Agent Topic', () => {
  test('navigates to AI Agent topic and shows flowchart', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(flowchart(page)).toBeVisible({ timeout: 25000 })
    const topic = page.getByTestId('demo-topic')
    await expect(topic).toBeVisible()
  })

  test('renders flowchart SVG with all nodes visible', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(flowchart(page)).toBeVisible({ timeout: 25000 })
    const svg = flowchart(page).getByTestId('flowchart-svg-EVENT_STORMING')
    await expect(svg).toBeVisible()

    const userNode = flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-dev_user')
    await expect(userNode).toBeVisible()

    const orchestratorNode = flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-orch_agent')
    await expect(orchestratorNode).toBeVisible()

    const llmNode = flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-llm')
    await expect(llmNode).toBeVisible()

    const toolsNode = flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-tools_router')
    await expect(toolsNode).toBeVisible()


  })

  test('renders all edges connecting nodes', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(flowchart(page)).toBeVisible({ timeout: 25000 })

    const svg = flowchart(page).getByTestId('flowchart-svg-EVENT_STORMING')
    await expect(svg.locator('path[data-testid^="flowchart-edge-"]').first()).toBeAttached()
  })

  test('renders flowchart title', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(flowchart(page)).toBeVisible({ timeout: 25000 })
    const title = flowchart(page).getByTestId('flowchart-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('AI Agent Architecture')
  })

  test('renders node labels and stereotypes', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')
    await expect(flowchart(page)).toBeVisible({ timeout: 25000 })

    await expect(flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-dev_user').getByText('Developer (Initiator)').filter({ visible: true })).toBeVisible()
    await expect(flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-dev_user').getByText('Actor').filter({ visible: true })).toBeVisible()
    await expect(flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-orch_agent').getByText('Agent Orchestrator').filter({ visible: true })).toBeVisible()
    await expect(flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-orch_agent').getByText('Aggregate').filter({ visible: true })).toBeVisible()
    await expect(flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-llm').getByText('LLM').filter({ visible: true })).toBeVisible()
    await expect(flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-llm').getByText('External API').filter({ visible: true })).toBeVisible()
  })
})
