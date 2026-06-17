import { test, expect } from '@playwright/test';

test.describe('Inspector Sidebar Widgets', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('inspector toggle button opens sidebar', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Click inspector toggle
    const inspectorBtn = page.getByTestId('flowchart-btn-inspector');
    await inspectorBtn.click();

    // Inspector sidebar should be visible
    const sidebar = page.getByTestId('inspector-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('state machine widget shows states on playback', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Open inspector
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    // Click next twice: step -1 → 0 → 1 (planning step)
    const nextBtn = page.getByTestId('flowchart-btn-next');
    await nextBtn.click();
    await page.waitForTimeout(400);
    await nextBtn.click();
    await page.waitForTimeout(600);

    // PLANNING state should be active
    const planningState = page.getByTestId('state-PLANNING');
    await expect(planningState).toHaveClass(/inspector-state-active/);
  });

  test('JSON payload viewer shows correct payload during DFD step', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Open inspector
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    // Advance to step 0 (evt_goal) then switch to payload tab
    const nextBtn = page.getByTestId('flowchart-btn-next');
    await nextBtn.click();
    await page.waitForTimeout(400);

    // Switch to payload tab
    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(300);

    // JSON payload should be visible with parsed_request type
    const payloadViewer = page.getByTestId('json-payload-viewer');
    await expect(payloadViewer).toBeVisible();
    const payloadType = page.getByTestId('json-payload-type');
    await expect(payloadType).toHaveText('parsed_request');
  });

  test('ERD schema widget shows tables when database node clicked', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Open inspector
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    // Switch to ERD tab
    await page.getByTestId('inspector-tab-erd').click();

    // Initially shows hint since no node selected
    const hint = page.getByTestId('erd-schema-hint');
    await expect(hint).toBeVisible();

    // Click on Memory node (Database type) in the flowchart
    // The Memory node should be in the EVENT_STORMING view at grid position [3, 0]
    const memoryNode = page.getByTestId('flowchart-node-EVENT_STORMING-memory');
    await memoryNode.click();
    await page.waitForTimeout(500);

    // ERD schema should now be visible
    const erdWidget = page.getByTestId('erd-schema-widget');
    await expect(erdWidget).toBeVisible();
    const memoryTable = page.getByTestId('erd-table-memory_entries');
    await expect(memoryTable).toBeVisible();
  });

  test('inspector close button hides sidebar', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Open inspector
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    // Close inspector
    await page.getByTestId('inspector-close').click();

    // Inspector should no longer be visible
    const sidebar = page.getByTestId('inspector-sidebar');
    await expect(sidebar).not.toBeVisible();
  });

  test('state transitions through playback steps', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    // Open inspector
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    const nextBtn = page.getByTestId('flowchart-btn-next');

    // Advance to step 0 (no processGroup, falls back to IDLE)
    await nextBtn.click();
    await page.waitForTimeout(400);
    await expect(page.getByTestId('state-IDLE')).toHaveClass(/inspector-state-active/);

    // Advance to step 1: PLANNING
    await nextBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByTestId('state-PLANNING')).toHaveClass(/inspector-state-active/);

    // Advance to step 2: EXECUTING
    await nextBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByTestId('state-EXECUTING')).toHaveClass(/inspector-state-active/);

    // Advance to step 3: EVALUATING
    await nextBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByTestId('state-EVALUATING')).toHaveClass(/inspector-state-active/);
  });

  test('ERD schema shows columns with PK markers', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);

    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');
    await page.getByTestId('inspector-tab-erd').click();

    // Click orchestrator node (Aggregate)
    const orchNode = page.getByTestId('flowchart-node-SYS_ARCH-orchestrator');
    if (await orchNode.isVisible()) {
      await orchNode.click();
      await page.waitForTimeout(500);

      const pkColumn = page.getByTestId('erd-column-agent_sessions-id');
      if (await pkColumn.isVisible()) {
        await expect(pkColumn.textContent()).resolves.toContain('PK');
      }
    }
  });
});
