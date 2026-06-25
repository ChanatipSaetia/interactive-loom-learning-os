import { test, expect } from '@playwright/test';

test.describe('Minimal Mode Node Popup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.getByTestId('flowchart-section').waitFor({ state: 'visible' });
  });

  test('minimal mode popup shows on node click', async ({ page }) => {
    const section = page.getByTestId('flowchart-section');
    expect(await section.getAttribute('class')).not.toContain('fullscreen');

    const firstNode = page.getByTestId('flowchart-node-EVENT_STORMING-user');
    await firstNode.click();

    const popup = page.getByTestId('flowchart-node-popup');
    await expect(popup).toBeVisible();

    const enterBtn = page.getByTestId('flowchart-node-popup-enter-fullscreen');
    await expect(enterBtn).toBeVisible();
    await expect(enterBtn).toContainText('Enter Fullscreen');
  });

  test('minimal popup contains CTA message', async ({ page }) => {
    const firstNode = page.getByTestId('flowchart-node-EVENT_STORMING-user');
    await firstNode.click();

    await expect(page.getByTestId('flowchart-node-popup')).toBeVisible();
    await expect(page.getByText('Open fullscreen to view details and interactive lifecycle')).toBeVisible();
  });

  test('minimal popup does not show detailed node info', async ({ page }) => {
    const firstNode = page.getByTestId('flowchart-node-EVENT_STORMING-user');
    await firstNode.click();

    await expect(page.getByTestId('flowchart-node-popup')).toBeVisible();
    await expect(page.getByText('Related Views')).not.toBeVisible();
    await expect(page.getByText('States / Lifecycle')).not.toBeVisible();
  });

  test('enter fullscreen button from popup enters fullscreen mode', async ({ page }) => {
    const firstNode = page.getByTestId('flowchart-node-EVENT_STORMING-user');
    await firstNode.click();

    const enterBtn = page.getByTestId('flowchart-node-popup-enter-fullscreen');
    await enterBtn.click();

    const section = page.getByTestId('flowchart-section');
    expect(await section.getAttribute('class')).toContain('fullscreen');

    await expect(page.getByTestId('flowchart-node-popup')).not.toBeVisible();
  });

  test('close button in minimal popup closes popup', async ({ page }) => {
    const firstNode = page.getByTestId('flowchart-node-EVENT_STORMING-user');
    await firstNode.click();

    await expect(page.getByTestId('flowchart-node-popup')).toBeVisible();

    await page.getByTestId('flowchart-node-popup-close').click();
    await expect(page.getByTestId('flowchart-node-popup')).not.toBeVisible();
  });

  test('minimal popup appears for any node regardless of cross-view links', async ({ page }) => {
    const cmdRunNode = page.getByTestId('flowchart-node-EVENT_STORMING-cmd_run_agent');
    await cmdRunNode.click();

    await expect(page.getByTestId('flowchart-node-popup')).toBeVisible();
    await expect(page.getByTestId('flowchart-node-popup-enter-fullscreen')).toBeVisible();
  });

  test('fullscreen mode detailed popup still works for multi-view nodes', async ({ page }) => {
    await page.getByTestId('flowchart-fullscreen-toggle').click();

    const section = page.getByTestId('flowchart-section');
    expect(await section.getAttribute('class')).toContain('fullscreen');

    const orchNode = page.getByTestId('flowchart-node-EVENT_STORMING-orch_agent');
    await orchNode.click();

    const popup = page.getByTestId('flowchart-node-popup');
    await expect(popup).toBeVisible();

    await expect(page.getByText('Related Views')).toBeVisible();
  });

  test('node shows pointer cursor in minimal mode', async ({ page }) => {
    const firstNode = page.getByTestId('flowchart-node-EVENT_STORMING-user');
    const cursor = await firstNode.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  });
});
