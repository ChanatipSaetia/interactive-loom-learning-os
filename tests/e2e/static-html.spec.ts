import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Static HTML OKF embed (Serverless & CDN)', () => {
  test('renders OKF sections read-only via file:// protocol (Zero Web Server required)', async ({ page }) => {
    const staticFilePath = path.resolve(process.cwd(), 'test-okf-static', 'index.html')
    const fileUrl = `file://${staticFilePath}`

    await page.goto(fileUrl)

    // 1. Verify the embedded top navigation and page title
    await expect(page.locator('.topnav-title')).toHaveText('Learning OS')
    await expect(page.locator('.status-badge')).toContainText('Standalone UMD Mode')
    await expect(page.locator('#loom-root')).toContainText('Interactive OKF Catalog')

    // 2. Verify OKF sections rendered cleanly in static mode
    await expect(page.locator('#loom-root')).toContainText('System Architecture & OKF Overview')
    await expect(page.locator('#loom-root')).toContainText('Core Concepts & Principles')
    await expect(page.locator('#loom-root')).toContainText('Key Features & Capabilities')
    await expect(page.locator('#loom-root')).toContainText('Knowledge Check Quiz')

    // 3. Embeds are read-only: no edit toggles (authoring happens in Loom Studio)
    await expect(page.locator('[data-testid^="edit-section-toggle"]')).toHaveCount(0)
  })

  test('renders OKF sections read-only when served over HTTP server', async ({ page }) => {
    await page.goto('/test-okf-static/index.html')

    await expect(page.locator('.topnav-title')).toHaveText('Learning OS')
    await expect(page.locator('#loom-root')).toContainText('Introduction')

    await expect(page.locator('[data-testid^="edit-section-toggle"]')).toHaveCount(0)
  })
})
