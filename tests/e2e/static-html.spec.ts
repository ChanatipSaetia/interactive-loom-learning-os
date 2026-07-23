import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Static HTML OKF Parser & Editor (Serverless & CDN)', () => {
  test('renders and edits OKF sections directly via file:// protocol (Zero Web Server required)', async ({ page }) => {
    const staticFilePath = path.resolve(process.cwd(), 'test-okf-static', 'index.html')
    const fileUrl = `file://${staticFilePath}`

    await page.goto(fileUrl)

    // 1. Verify header title and offline status badge
    await expect(page.locator('header h1')).toHaveText('Loom Standalone OKF Parser & Editor')
    await expect(page.locator('#status')).toContainText('file:// static mode')

    // 2. Verify OKF sections rendered cleanly in static mode
    await expect(page.locator('#loom-root')).toContainText('System Architecture & OKF Overview')
    await expect(page.locator('#loom-root')).toContainText('Core Concepts & Principles')
    await expect(page.locator('#loom-root')).toContainText('Key Features & Capabilities')
    await expect(page.locator('#loom-root')).toContainText('Knowledge Check Quiz')

    // 3. Verify section edit toggle button opens split-pane editor
    const editBtn = page.getByTestId('edit-section-toggle-1')
    await expect(editBtn).toBeVisible()
    await editBtn.click()

    // 4. Verify split-pane editor panels
    await expect(page.getByTestId('editor-panel')).toBeVisible()
    await expect(page.getByTestId('editor-preview-wrapper')).toBeVisible()
    await expect(page.getByTestId('editor-tab-form')).toBeVisible()
    await expect(page.getByTestId('editor-tab-raw')).toBeVisible()

    // 5. Test tab switching to Raw YAML
    await page.getByTestId('editor-tab-raw').click()
    await expect(page.getByTestId('raw-yaml-editor')).toBeVisible()

    // 6. Test downloading exported files
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('editor-download-btn').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('section.md')

    // 7. Exit edit mode and verify updated view
    const doneBtn = page.locator('.edit-section-toggle.active')
    await doneBtn.click()
    await expect(page.getByTestId('editor-panel')).not.toBeVisible()
    await expect(page.locator('#loom-root')).toContainText('Core Concepts & Principles')
  })

  test('renders and edits OKF sections when served over HTTP server', async ({ page }) => {
    await page.goto('/test-okf-static/index.html')

    await expect(page.locator('header h1')).toHaveText('Loom Standalone OKF Parser & Editor')
    await expect(page.locator('#loom-root')).toContainText('Introduction')

    // Test edit toggle in HTTP mode
    const editBtn = page.getByTestId('edit-section-toggle-0')
    await expect(editBtn).toBeVisible()
    await editBtn.click()

    await expect(page.getByTestId('editor-panel')).toBeVisible()
    await expect(page.getByTestId('editor-tab-form')).toBeVisible()
  })
})
