import { test, expect } from '@playwright/test'

test.describe('US-10: Bullets Section', () => {
  test('renders bullets section with list items', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const bulletsSection = page.getByTestId('bullets-section')
    await expect(bulletsSection).toBeVisible()

    const firstItem = page.getByTestId('bullet-text-0')
    await expect(firstItem).toBeVisible()
    await expect(firstItem).toHaveText('Tool use — call external APIs, run code, browse the web')
  })

  test('renders section title', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await expect(page.getByTestId('bullets-title')).toBeVisible()
    await expect(page.getByTestId('bullets-title')).toHaveText('Key Agent Capabilities')
  })

  test('renders all bullet text items', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    await expect(page.getByTestId('bullet-text-0')).toBeVisible()
    await expect(page.getByTestId('bullet-text-1')).toBeVisible()
    await expect(page.getByTestId('bullet-text-2')).toBeVisible()
    await expect(page.getByTestId('bullet-text-3')).toBeVisible()
  })

  test('renders bullet markers', async ({ page }) => {
    await page.goto('/#/demo/ai-agent')

    const markers = page.getByTestId('bullet-marker-0')
    await expect(markers).toBeVisible()
  })
})
