import { test, expect } from '@playwright/test'

test.describe('Issue #18: AI Agent SituationChoice', () => {
  test('AI Agent topic renders with situation-choice section', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    const section = page.getByTestId('situation-choice')
    await expect(section).toBeVisible()
  })

  test('Orchestration Strategy situation renders with correct data', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    const heading = page.getByTestId('situation-choice-heading-0')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Orchestration Strategy')

    const banner = page.getByTestId('situation-banner-0')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('research and summarize a topic')

    const recBanner = page.getByTestId('recommendation-banner-0')
    await expect(recBanner).toBeVisible()
    await expect(recBanner).toContainText('ReAct loop')

    const reactCard = page.getByTestId('situation-card-0-react-loop')
    await expect(reactCard).toBeVisible()

    const multiAgentCard = page.getByTestId('situation-card-0-multi-agent-pipeline')
    await expect(multiAgentCard).toBeVisible()

    const recommendedBadge = page.getByTestId('situation-badge-0-react-loop')
    await expect(recommendedBadge).toBeVisible()
    await expect(recommendedBadge).toContainText('Recommended')
  })

  test('Component Placement situation renders with correct data', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Component Placement' }).click()

    const heading = page.getByTestId('situation-choice-heading-1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Component Placement')

    const banner = page.getByTestId('situation-banner-1')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('memory subsystem')

    const recBanner = page.getByTestId('recommendation-banner-1')
    await expect(recBanner).toBeVisible()
    await expect(recBanner).toContainText('vector database')

    const vectorDbCard = page.getByTestId('situation-card-1-vector-db')
    await expect(vectorDbCard).toBeVisible()

    const codeSandboxCard = page.getByTestId('situation-card-1-code-sandbox')
    await expect(codeSandboxCard).toBeVisible()

    const cotCard = page.getByTestId('situation-card-1-chain-of-thought')
    await expect(cotCard).toBeVisible()

    const recommendedBadge = page.getByTestId('situation-badge-1-vector-db')
    await expect(recommendedBadge).toBeVisible()
    await expect(recommendedBadge).toContainText('Recommended')
  })

  test('situation dropdown allows switching between situations', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    await expect(page.getByTestId('situation-select')).toContainText('Orchestration Strategy')

    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Component Placement' }).click()

    await expect(page.getByTestId('situation-select')).toContainText('Component Placement')

    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Orchestration Strategy' }).click()

    await expect(page.getByTestId('situation-select')).toContainText('Orchestration Strategy')
  })

  test('recommended card is open by default for each situation', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    await expect(page.getByTestId('situation-card-content-0-react-loop')).toBeVisible()
    await expect(page.getByTestId('situation-card-content-0-multi-agent-pipeline')).not.toBeVisible()

    await page.getByTestId('situation-select').click()
    await page.getByRole('option', { name: 'Component Placement' }).click()

    await expect(page.getByTestId('situation-card-content-1-vector-db')).toBeVisible()
    await expect(page.getByTestId('situation-card-content-1-code-sandbox')).not.toBeVisible()
    await expect(page.getByTestId('situation-card-content-1-chain-of-thought')).not.toBeVisible()
  })

  test('non-recommended cards show pros and cons when expanded', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    const trigger = page.getByTestId('situation-card-trigger-0-multi-agent-pipeline')
    await trigger.click()

    await expect(page.getByTestId('situation-pros-0-multi-agent-pipeline')).toBeVisible()
    await expect(page.getByTestId('situation-cons-0-multi-agent-pipeline')).toBeVisible()
  })

  test('Compare All button renders and opens modal', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    const button = page.getByTestId('compare-all-button-0')
    await expect(button).toBeVisible()
    await button.click()

    const dialog = page.getByTestId('compare-dialog-0')
    await expect(dialog).toBeVisible()

    await expect(page.getByTestId('compare-card-0-react-loop')).toBeVisible()
    await expect(page.getByTestId('compare-card-0-multi-agent-pipeline')).toBeVisible()
  })

  test('old drag-drop and choice sections are not present', async ({ page }) => {
    await page.goto('/topics/ai-agent')

    await expect(page.getByTestId('drag-drop')).not.toBeVisible()
    await expect(page.getByTestId('choice')).not.toBeVisible()
  })
})
