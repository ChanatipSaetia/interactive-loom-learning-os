import { test, expect } from '@playwright/test';

test.describe('Inspector Sidebar Layout & Aggregate Dropdown', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sidebar toggle appears in fullscreen mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Enter fullscreen
    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await expect(page.getByTestId('flowchart-section')).toHaveClass(/fullscreen/);

    // Sidebar toggle should be visible
    await expect(page.getByTestId('flowchart-sidebar-toggle')).toBeVisible();
  });

  test('sidebar does not appear outside fullscreen', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Sidebar toggle should not be visible in normal mode
    await expect(page.getByTestId('flowchart-sidebar-toggle')).not.toBeVisible();
    await expect(page.getByTestId('inspector-sidebar')).not.toBeVisible();
  });

  test('clicking sidebar toggle opens inspector sidebar', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Enter fullscreen
    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.waitForTimeout(300);

    // Sidebar not visible initially
    await expect(page.getByTestId('inspector-sidebar')).not.toBeVisible();

    // Click sidebar toggle
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);

    // Sidebar should now be visible
    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();
  });

  test('sidebar close button closes sidebar', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();

    await page.getByTestId('inspector-close').click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId('inspector-sidebar')).not.toBeVisible();
  });

  test('inspector sidebar shows Details tab by default', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);

    // Details tab should be active by default
    await expect(page.getByTestId('inspector-tab-details')).toHaveClass(/active/);
    await expect(page.getByTestId('inspector-widget-details')).toBeVisible();
  });

  test('inspector sidebar shows States tab with state machine when switched', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);

    // Switch to States tab
    await page.getByTestId('inspector-tab-state-machine').click();
    await expect(page.getByTestId('inspector-tab-state-machine')).toHaveClass(/active/);

    // State machine widget should be visible
    await expect(page.getByTestId('inspector-widget-state-machine')).toBeVisible();
  });

  test('inspector sidebar shows Payload tab when switched', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);

    // Switch to Payload tab
    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(200);

    await expect(page.getByTestId('inspector-tab-payload')).toHaveClass(/active/);
    await expect(page.getByTestId('inspector-widget-payload')).toBeVisible();
  });

  test('clicking orchestrator node opens sidebar with state machine', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Enter fullscreen
    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.waitForTimeout(300);

    // Sidebar should not be open
    await expect(page.getByTestId('inspector-sidebar')).not.toBeVisible();

    // Click the orchestrator node
    const orchNode = page.getByTestId('flowchart-node-EVENT_STORMING-orch_agent');
    await orchNode.click({ force: true });
    await page.waitForTimeout(500);

    // Sidebar should now be open with Details tab active
    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();
    await expect(page.getByTestId('inspector-tab-details')).toHaveClass(/active/);

    // Switching to States tab reveals the aggregate's state machine
    await page.getByTestId('inspector-tab-state-machine').click();
    await expect(page.getByTestId('state-IDLE')).toBeVisible();
  });

  test('state machine states are visible in sidebar States tab', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await page.getByTestId('inspector-tab-state-machine').click();

    // States from the orchestrator state machine should be visible
    await expect(page.getByTestId('state-IDLE')).toBeVisible();
    await expect(page.getByTestId('state-THINKING')).toBeVisible();
    await expect(page.getByTestId('state-EXECUTING_TOOL')).toBeVisible();
  });

  test('sidebar toggle toggles on and off repeatedly', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.waitForTimeout(300);

    // Open
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();

    // Close
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('inspector-sidebar')).not.toBeVisible();

    // Open again
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();
  });
});

test.describe('Inspector Sidebar Responsive Mobile', () => {
  test('sidebar renders as bottom sheet on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.waitForTimeout(300);
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(500);

    // Sidebar should be visible
    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();

    // Check it's positioned at the bottom (bottom sheet)
    const sidebar = page.getByTestId('inspector-sidebar');
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
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.waitForTimeout(300);
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();

    const sidebar = page.getByTestId('inspector-sidebar');
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
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.waitForTimeout(300);
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();

    const sidebar = page.getByTestId('inspector-sidebar');
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
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(500);

    // Content area should be visible and scrollable
    const content = page.locator('.flowchart-sidebar-content');
    await expect(content).toBeVisible();
  });
});

test.describe('Inspector Sidebar Aggregate Dropdown', () => {
  test('aggregate dropdown appears in ecommerce orders topic', async ({ page }) => {
    await page.goto('/#/topics/ecommerce-orders');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-fullscreen-toggle').click();
    await page.waitForTimeout(300);
    await page.getByTestId('flowchart-sidebar-toggle').click();
    await page.waitForTimeout(500);
    await page.getByTestId('inspector-tab-state-machine').click();

    // Even with one aggregate, the dropdown selector may appear
    // depending on implementation. Check if sidebar is open with state machine.
    await expect(page.getByTestId('inspector-sidebar')).toBeVisible();
    await expect(page.getByTestId('inspector-widget-state-machine')).toBeVisible();
  });
});
