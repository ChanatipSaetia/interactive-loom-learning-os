import { test, expect } from '@playwright/test';

test.describe('Active Node Popup Widgets', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('clicking a node opens the active node popup and close button closes it', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Click on User node
    const userNode = page.getByTestId('flowchart-node-EVENT_STORMING-user');
    await userNode.click();

    // Node popup should be visible
    const popup = page.getByTestId('flowchart-node-popup');
    await expect(popup).toBeVisible();

    // Close popup
    await page.getByTestId('flowchart-node-popup-close').click();
    await expect(popup).not.toBeVisible();
  });

  test('state machine widget shows states on playback inside popup', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Click next once: step -1 → 0 (evt_started, state IDLE)
    const nextBtn = page.getByTestId('flowchart-btn-next');
    await nextBtn.click();
    await page.waitForTimeout(400);

    // Click on Orchestrator node to open popup
    const orchNode = page.getByTestId('flowchart-node-EVENT_STORMING-orch_agent');
    await orchNode.click({ force: true });
    await page.waitForTimeout(500);

    // IDLE state should be active in state machine
    const idleState = page.getByTestId('state-IDLE');
    await expect(idleState).toHaveClass(/inspector-state-active/);

    // Close popup
    await page.getByTestId('flowchart-node-popup-close').click();

    // Click next: step 0 → 1 (evt_reasoned, state THINKING)
    await nextBtn.click();
    await page.waitForTimeout(400);

    // Click on Orchestrator node again
    await orchNode.click({ force: true });
    await page.waitForTimeout(500);

    // THINKING state should be active
    const thinkingState = page.getByTestId('state-THINKING');
    await expect(thinkingState).toHaveClass(/inspector-state-active/);
  });

});
