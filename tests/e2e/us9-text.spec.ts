import { test, expect } from '@playwright/test'

test.describe('US-9: Text Section', () => {
  test('renders text section with paragraphs', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const textSection = page.getByTestId('text-section')
    await expect(textSection).toBeVisible()

    const firstParagraph = page.getByTestId('text-paragraph-0')
    await expect(firstParagraph).toBeVisible()
  })

  test('renders section title and heading', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await expect(page.getByTestId('text-title')).toBeVisible()
    await expect(page.getByTestId('text-title')).toHaveText('What is REST?')

    await expect(page.getByTestId('text-heading')).toBeVisible()
    await expect(page.getByTestId('text-heading')).toHaveText('Representational State Transfer')
  })

  test('renders inline code with monospace styling', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const codes = page.getByTestId('text-inline-code')
    await expect(codes.first()).toBeVisible()
    await expect(codes.first()).toHaveText('GET')
  })

  test('renders links with action-blue styling', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const link = page.getByTestId('text-link')
    await expect(link).toBeVisible()
    await expect(link).toHaveText('RESTful API Guide')
    await expect(link).toHaveAttribute('href', 'https://restfulapi.net')
  })

  test('renders multiple paragraphs', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await expect(page.getByTestId('text-paragraph-0')).toBeVisible()
    await expect(page.getByTestId('text-paragraph-1')).toBeVisible()
    await expect(page.getByTestId('text-paragraph-2')).toBeVisible()
  })
})
