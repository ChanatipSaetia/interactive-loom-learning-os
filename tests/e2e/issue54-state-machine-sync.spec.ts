import { test, expect } from '@playwright/test';

test.describe('Issue #54: State Machine Layout and Playback Synchronization', () => {
  test('synchronizes active state node with stepper and verifies compact layout', async ({ page }) => {
    // 1. Navigate to AI Agent topic
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');

    // 2. Click on the orchestrator aggregate node to open the popup
    // (Note: in Event Storming, orch_agent is rendered, which is collapsed to orchestrator)
    const orchestratorNodeES = page.getByTestId('flowchart-node-EVENT_STORMING-orch_agent');
    await expect(orchestratorNodeES).toBeVisible();
    await orchestratorNodeES.click();

    // 3. Switch to State Machine view from the popup
    const stateMachineBtn = page.locator('.flowchart-popup-btn:has-text("State Machine")');
    await expect(stateMachineBtn).toBeVisible();
    await stateMachineBtn.click();

    // Verify State Machine SVG is visible
    const smSvg = page.getByTestId('flowchart-svg-STATE_MACHINE');
    await expect(smSvg).toBeVisible();

    // 4. Get node locators
    const idleNode = page.getByTestId('flowchart-node-STATE_MACHINE-orchestrator_state_IDLE');
    const thinkingNode = page.getByTestId('flowchart-node-STATE_MACHINE-orchestrator_state_THINKING');

    await expect(idleNode).toBeVisible();
    await expect(thinkingNode).toBeVisible();

    // 5. Verify compact layout: No empty columns between IDLE and THINKING
    const idleBox = await idleNode.boundingBox();
    const thinkingBox = await thinkingNode.boundingBox();

    expect(idleBox).not.toBeNull();
    expect(thinkingBox).not.toBeNull();

    if (idleBox && thinkingBox) {
      const xDiff = Math.abs(thinkingBox.x - idleBox.x);
      // In the compacted layout:
      // IDLE is in column 0, THINKING is in column 2.
      // Column width is 140px. The difference should be around 280px (on screen ~270px).
      // If there were empty columns, the difference would be 10 columns (1400px, on screen >600px).
      console.log(`IDLE X: ${idleBox.x}, THINKING X: ${thinkingBox.x}, Diff: ${xDiff}`);
      expect(xDiff).toBeLessThan(400);
    }

    // 6. Enter playback mode by clicking Next (advancing to step 0: IDLE state active)
    const nextBtn = page.getByTestId('flowchart-btn-next');
    await nextBtn.click();

    // Verify initial node (IDLE) is at full opacity
    await expect(idleNode).toHaveCSS('opacity', '1');
    // Other nodes (THINKING) should now be dimmed (opacity 0.25)
    await expect(thinkingNode).toHaveCSS('opacity', '0.25');

    // 7. Click Next step again (advancing to step 1: THINKING state active)
    await nextBtn.click();

    // Now (step 1), we should transition to THINKING.
    // Verify thinking node becomes highlighted (opacity 1)
    await expect(thinkingNode).toHaveCSS('opacity', '1');
    // IDLE should now be dimmed (opacity 0.25)
    await expect(idleNode).toHaveCSS('opacity', '0.25');
  });
});
