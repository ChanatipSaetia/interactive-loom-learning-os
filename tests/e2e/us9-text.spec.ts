import { test, expect } from '@playwright/test'

test('a composed page renders its heading and text paragraphs', async ({ page }) => {
  await page.goto('/#/demo/ai-agent')
  const heading = page.getByRole('heading', { name: 'Agent Lifecycle', exact: true })
  await expect(heading).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('Goal Intake', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('Context Retrieval', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('Response Delivery', { exact: false }).first()).toBeVisible()
})
