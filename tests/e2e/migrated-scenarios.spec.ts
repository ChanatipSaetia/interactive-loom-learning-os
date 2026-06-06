import { test, expect } from '@playwright/test'

test.describe('Migrated Tradeoff Sandbox Scenarios', () => {

  test('AgentOps section loads and functions correctly', async ({ page }) => {
    await page.goto('/#/demo/agentops')
    await expect(page.getByTestId('tradeoff-sandbox')).toBeVisible()
    
    // Check custom metrics exist
    await expect(page.getByTestId('metric-bar-observability')).toBeVisible()
    await expect(page.getByTestId('metric-bar-overhead')).toBeVisible()
    
    // Make a selection and verify progress updates
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-traditional').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('1 / 3')
  })

  test('AI Governance section loads and functions correctly', async ({ page }) => {
    await page.goto('/#/demo/ai-governance')
    await expect(page.getByTestId('tradeoff-sandbox')).toBeVisible()
    
    // Check custom metrics exist
    await expect(page.getByTestId('metric-bar-mitigation')).toBeVisible()
    await expect(page.getByTestId('metric-bar-compliance')).toBeVisible()
    
    // Make a selection and verify progress updates
    await page.getByTestId('step-dropdown-trigger-0-0').click()
    await page.getByTestId('dropdown-option-0-0-shadow').click()
    await expect(page.getByTestId('progress-indicator')).toHaveText('1 / 3')
  })

  test('AI Operating Model section loads and functions correctly', async ({ page }) => {
    await page.goto('/#/demo/ai-operating-model')
    await expect(page.getByTestId('tradeoff-sandbox')).toBeVisible()
    
    // Check custom metrics exist
    await expect(page.getByTestId('metric-bar-agility')).toBeVisible()
    await expect(page.getByTestId('metric-bar-complexity')).toBeVisible()
    
    // Check scenario select dropdown exists and has the 4 scenarios
    await expect(page.getByTestId('scenario-select')).toBeVisible()
    await page.getByTestId('scenario-select').click()
    await expect(page.getByRole('option', { name: 'Autonomy Tier Decision' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Human-in-the-Loop Oversight Pattern' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Governance Architecture' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Production Deployment Readiness' })).toBeVisible()
  })

})
