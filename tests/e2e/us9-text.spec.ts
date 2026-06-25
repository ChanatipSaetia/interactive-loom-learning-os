import { test, expect } from '@playwright/test'

test.describe('US-9: Text Section', () => {
  test('renders text section with paragraphs', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const textSection = page.getByTestId('text-section').first()
    await expect(textSection).toBeVisible()

    const firstParagraph = textSection.locator('[data-testid="text-paragraph-0"]')
    await expect(firstParagraph).toBeVisible()
  })

  test('renders section title and heading', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const firstSection = page.getByTestId('text-section').first()
    await expect(firstSection.locator('[data-testid="text-title"]')).toBeVisible()
    await expect(firstSection.locator('[data-testid="text-title"]')).toHaveText('What is an AI Agent?')

    await expect(firstSection.locator('[data-testid="text-heading"]')).toBeVisible()
    await expect(firstSection.locator('[data-testid="text-heading"]')).toHaveText('Autonomous Goal-Directed Systems')
  })

  test('renders paragraph content about AI agents', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const firstSection = page.getByTestId('text-section').first()

    const firstParagraph = firstSection.locator('[data-testid="text-paragraph-0"]')
    await expect(firstParagraph).toContainText('AI agent')

    const secondParagraph = firstSection.locator('[data-testid="text-paragraph-1"]')
    await expect(secondParagraph).toContainText('large language model')

    const thirdParagraph = firstSection.locator('[data-testid="text-paragraph-2"]')
    await expect(thirdParagraph).toContainText('orchestration strategy')
  })

  test('renders multiple paragraphs', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const firstSection = page.getByTestId('text-section').first()
    await expect(firstSection.locator('[data-testid="text-paragraph-0"]')).toBeVisible()
    await expect(firstSection.locator('[data-testid="text-paragraph-1"]')).toBeVisible()
    await expect(firstSection.locator('[data-testid="text-paragraph-2"]')).toBeVisible()
  })
})
