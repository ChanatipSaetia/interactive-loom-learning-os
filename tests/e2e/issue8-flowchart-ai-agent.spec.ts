import { test, expect } from '@playwright/test'

test.describe('Issue #8: Flowchart Section + AI Agent Topic', () => {
  test('navigates to AI Agent topic and shows flowchart', async ({ page }) => {
    await page.goto('/topics/ai-agent')
    const topic = page.getByTestId('ai-agent-topic')
    await expect(topic).toBeVisible()
  })

  test('renders flowchart SVG with all nodes visible', async ({ page }) => {
    await page.goto('/topics/ai-agent')
    const svg = page.getByTestId('flowchart-svg')
    await expect(svg).toBeVisible()

    const userNode = page.getByTestId('flowchart-node-user')
    await expect(userNode).toBeVisible()

    const agentNode = page.getByTestId('flowchart-node-ai-agent')
    await expect(agentNode).toBeVisible()

    const llmNode = page.getByTestId('flowchart-node-llm')
    await expect(llmNode).toBeVisible()

    const searchNode = page.getByTestId('flowchart-node-tools-search')
    await expect(searchNode).toBeVisible()

    const codeNode = page.getByTestId('flowchart-node-tools-code')
    await expect(codeNode).toBeVisible()

    const memoryNode = page.getByTestId('flowchart-node-memory')
    await expect(memoryNode).toBeVisible()
  })

  test('renders all edges connecting nodes', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    const svg = page.getByTestId('flowchart-svg')
    for (let i = 0; i < 5; i++) {
      const edgeGroup = svg.getByTestId(`flowchart-edge-${i}`)
      const line = edgeGroup.locator('line')
      await expect(line).toBeInViewport()
    }
  })

  test('renders flowchart title', async ({ page }) => {
    await page.goto('/topics/ai-agent')
    const title = page.getByTestId('flowchart-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('AI Agent Architecture')
  })

  test('renders node labels and stereotypes', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    await expect(page.getByTestId('flowchart-node-user').getByText('User')).toBeVisible()
    await expect(page.getByText('<<actor>>')).toBeVisible()
    await expect(page.getByTestId('flowchart-node-ai-agent').getByText('AI Agent')).toBeVisible()
    await expect(page.getByText('<<agent>>')).toBeVisible()
    await expect(page.getByText('<<model>>')).toBeVisible()
    await expect(page.getByText('<<tool>>').first()).toBeVisible()
    await expect(page.getByText('<<storage>>')).toBeVisible()
  })
})
