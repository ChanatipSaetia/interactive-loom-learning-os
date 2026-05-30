import { test, expect } from '@playwright/test'

test.describe('US-7: DragDrop Section', () => {
  test('renders drag-drop section with zones and items', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    const dragDrop = page.getByTestId('drag-drop')
    await expect(dragDrop).toBeVisible()

    const zones = page.getByTestId('drag-drop-zones')
    await expect(zones).toBeVisible()

    const tray = page.getByTestId('drag-drop-tray')
    await expect(tray).toBeVisible()

    await expect(page.getByTestId('zone-rest')).toBeVisible()
    await expect(page.getByTestId('zone-ws')).toBeVisible()

    await expect(page.getByTestId('item-rest-call')).toBeVisible()
    await expect(page.getByTestId('item-ws-msg')).toBeVisible()
    await expect(page.getByTestId('item-http-req')).toBeVisible()
  })

  test('renders drag-drop section title', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')
    await expect(page.getByText('Categorize Communication Patterns')).toBeVisible()
  })

  test('dragging item to zone places it in the zone', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await page.getByTestId('item-rest-call').dragTo(page.getByTestId('zone-rest'))

    await expect(page.getByTestId('dropped-rest-call')).toBeVisible()
    expect(await page.getByTestId('item-rest-call').isVisible()).toBe(false)
  })

  test('validate button shows correct feedback', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await page.getByTestId('item-rest-call').dragTo(page.getByTestId('zone-rest'))
    await page.getByTestId('item-ws-msg').dragTo(page.getByTestId('zone-ws'))
    await page.getByTestId('item-http-req').dragTo(page.getByTestId('zone-rest'))

    const validateBtn = page.getByTestId('drag-drop-validate')
    await validateBtn.click()

    const feedback = page.getByTestId('drag-drop-feedback')
    await expect(feedback).toBeVisible()
    await expect(feedback).toHaveText('All correct!')
  })

  test('reset button returns items to tray', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')

    await page.getByTestId('item-rest-call').dragTo(page.getByTestId('zone-rest'))
    await page.getByTestId('item-ws-msg').dragTo(page.getByTestId('zone-ws'))
    await page.getByTestId('item-http-req').dragTo(page.getByTestId('zone-rest'))

    const resetBtn = page.getByTestId('drag-drop-reset')
    await resetBtn.click()

    await expect(page.getByTestId('item-rest-call')).toBeVisible()
    await expect(page.getByTestId('item-ws-msg')).toBeVisible()
    await expect(page.getByTestId('item-http-req')).toBeVisible()
  })

  test('validate button is disabled when not all items placed', async ({ page }) => {
    await page.goto('/demo/rest-vs-websocket')
    const validateBtn = page.getByTestId('drag-drop-validate')
    await expect(validateBtn).toBeDisabled()
  })
})
