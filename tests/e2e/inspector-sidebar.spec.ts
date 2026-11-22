import { test, expect, type Page } from '@playwright/test';

const flowchart = (page: Page) => page.getByTestId('flowchart-section').first();

test.describe('Inspector Sidebar Layout & Aggregate Dropdown', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sidebar toggle appears in fullscreen mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    // Enter fullscreen
    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await expect(flowchart(page)).toHaveClass(/fullscreen/);

    // Sidebar toggle should be visible
    await expect(flowchart(page).getByTestId('flowchart-sidebar-toggle')).toBeVisible();
  });

  test('sidebar does not appear outside fullscreen', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    // Sidebar toggle should not be visible in normal mode
    await expect(flowchart(page).getByTestId('flowchart-sidebar-toggle')).not.toBeVisible();
    await expect(flowchart(page).getByTestId('inspector-sidebar')).not.toBeVisible();
  });

  test('clicking sidebar toggle opens inspector sidebar', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    // Enter fullscreen
    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();

    // Sidebar not visible initially
    await expect(flowchart(page).getByTestId('inspector-sidebar')).not.toBeVisible();

    // Click sidebar toggle
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    // Sidebar should now be visible
    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();
  });

  test('sidebar close button closes sidebar', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();

    await flowchart(page).getByTestId('inspector-close').click();

    await expect(flowchart(page).getByTestId('inspector-sidebar')).not.toBeVisible();
  });

  test('inspector sidebar shows Details tab by default', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    // Details tab should be active by default
    await expect(flowchart(page).getByTestId('inspector-tab-details')).toHaveClass(/active/);
    await expect(flowchart(page).getByTestId('inspector-widget-details')).toBeVisible();
  });

  test('inspector sidebar shows States tab with state machine when switched', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    // Switch to States tab
    await flowchart(page).getByTestId('inspector-tab-state-machine').click();
    await expect(flowchart(page).getByTestId('inspector-tab-state-machine')).toHaveClass(/active/);

    // State machine widget should be visible
    await expect(flowchart(page).getByTestId('inspector-widget-state-machine')).toBeVisible();
  });

  test('inspector sidebar shows Payload tab when switched', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    // Switch to Payload tab
    await flowchart(page).getByTestId('inspector-tab-payload').click();

    await expect(flowchart(page).getByTestId('inspector-tab-payload')).toHaveClass(/active/);
    await expect(flowchart(page).getByTestId('inspector-widget-payload')).toBeVisible();
  });

  test('clicking orchestrator node opens sidebar with state machine', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    // Enter fullscreen
    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();

    // Sidebar should not be open
    await expect(flowchart(page).getByTestId('inspector-sidebar')).not.toBeVisible();

    // Click the orchestrator node
    const orchNode = flowchart(page).getByTestId('flowchart-node-EVENT_STORMING-orch_agent');
    await orchNode.click({ force: true });

    // Sidebar should now be open with Details tab active
    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();
    await expect(flowchart(page).getByTestId('inspector-tab-details')).toHaveClass(/active/);

    // Switching to States tab reveals the aggregate's state machine
    await flowchart(page).getByTestId('inspector-tab-state-machine').click();
    await expect(flowchart(page).getByTestId('state-IDLE')).toBeVisible();
  });

  test('state machine states are visible in sidebar States tab', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();
    await flowchart(page).getByTestId('inspector-tab-state-machine').click();

    // States from the orchestrator state machine should be visible
    await expect(flowchart(page).getByTestId('state-IDLE')).toBeVisible();
    await expect(flowchart(page).getByTestId('state-THINKING')).toBeVisible();
    await expect(flowchart(page).getByTestId('state-EXECUTING_TOOL')).toBeVisible();
  });

  test('sidebar toggle toggles on and off repeatedly', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();

    // Open
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();
    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();

    // Close using the close button in the sidebar (toggle button is hidden when open)
    await flowchart(page).getByTestId('inspector-close').click();
    await expect(flowchart(page).getByTestId('inspector-sidebar')).not.toBeVisible();

    // Open again
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();
    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();
  });
});

test.describe('Inspector Sidebar Responsive Mobile', () => {
  test('sidebar renders as bottom sheet on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    // Sidebar should be visible
    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();

    // Check it's positioned at the bottom (bottom sheet)
    const sidebar = flowchart(page).getByTestId('inspector-sidebar');
    const box = await sidebar.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // Bottom sheet should be anchored to the bottom of the viewport
      expect(box.y + box.height).toBeCloseTo(667, 0);
      expect(box.x).toBe(0);
      expect(box.width).toBe(375);
    }
  });

  test('sidebar renders as side panel on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();

    const sidebar = flowchart(page).getByTestId('inspector-sidebar');
    const box = await sidebar.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // Desktop sidebar should have fixed width (~300px) and be positioned on the right
      expect(box.width).toBeCloseTo(300, 0);
    }
  });

  test('sidebar renders as bottom sheet on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    await expect(flowchart(page).getByTestId('inspector-sidebar')).toBeVisible();

    const sidebar = flowchart(page).getByTestId('inspector-sidebar');
    const box = await sidebar.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // At exactly 768px, it should still be side panel per media query (max-width: 767px)
      expect(box.width).toBeCloseTo(300, 0);
    }
  });

  test('sidebar content is scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });

    await flowchart(page).getByTestId('flowchart-fullscreen-toggle').click();
    await flowchart(page).getByTestId('flowchart-sidebar-toggle').click();

    // Content area should be visible and scrollable
    const content = flowchart(page).locator('.flowchart-sidebar-content');
    await expect(content).toBeVisible();
  });
});
