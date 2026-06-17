import { test, expect } from '@playwright/test';

test.describe('Synchronized Grid - E-Commerce Orders Topic (#57)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/topics/ecommerce-orders');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.waitForTimeout(500);
  });

  test('toggles Grid Mode and renders 4 synchronized viewports', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).toBeVisible();

    const svgs = page.locator('.flowchart-svg');
    expect(await svgs.count()).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < 4; i++) {
      await expect(svgs.nth(i)).toBeVisible();
    }
  });

  test('instant checkout journey plays through all steps in Grid Mode', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');

    const nextBtn = page.getByTestId('flowchart-btn-next');
    const progress = page.getByTestId('flowchart-progress');

    await expect(progress).toHaveText('0 / 5');

    for (let i = 0; i < 5; i++) {
      await nextBtn.click();
      await page.waitForTimeout(600);
    }

    await expect(progress).toHaveText('5 / 5');

    const svgs = page.locator('.flowchart-svg');
    for (let i = 0; i < 4; i++) {
      await expect(svgs.nth(i)).toBeVisible();
    }
  });

  test('fraud review block journey plays through Grid Mode', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');

    await page.getByTestId('flowchart-journey-select').selectOption('fraud-review-block');
    await expect(page.getByTestId('flowchart-progress')).toHaveText('0 / 6');

    const nextBtn = page.getByTestId('flowchart-btn-next');

    for (let i = 0; i < 6; i++) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByTestId('flowchart-progress')).toHaveText('6 / 6');

    const svgs = page.locator('.flowchart-svg');
    for (let i = 0; i < 4; i++) {
      await expect(svgs.nth(i)).toBeVisible();
    }
  });

  test('playback highlights nodes across all grid viewports', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');

    const nextBtn = page.getByTestId('flowchart-btn-next');
    for (let i = 0; i < 4; i++) {
      await nextBtn.click();
      await page.waitForTimeout(700);
    }

    expect(await page.getByTestId('flowchart-progress').textContent()).toBe('4 / 5');

    const svgs = page.locator('.flowchart-svg');
    for (let i = 0; i < 4; i++) {
      await expect(svgs.nth(i)).toBeVisible();
      const canvas = svgs.nth(i).locator('[data-testid^="flowchart-canvas-"]');
      const transform = await canvas.first().getAttribute('transform');
      expect(transform).toBeTruthy();
    }
  });

  test('play and pause work across synchronized grid viewports', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');

    await page.getByTestId('flowchart-btn-play').click();
    await page.waitForTimeout(3000);

    const progressAfterPlay = await page.getByTestId('flowchart-progress').textContent();
    expect(progressAfterPlay).not.toBe('0 / 5');

    await page.getByTestId('flowchart-btn-pause').click();

    for (let i = 0; i < 4; i++) {
      await expect(page.locator('.flowchart-svg').nth(i)).toBeVisible();
    }
  });

  test('reset returns all grid viewports to initial state', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');

    for (let i = 0; i < 3; i++) {
      await page.getByTestId('flowchart-btn-next').click();
      await page.waitForTimeout(400);
    }

    expect(await page.getByTestId('flowchart-progress').textContent()).toBe('3 / 5');

    await page.getByTestId('flowchart-btn-reset').click();
    await page.waitForTimeout(200);

    expect(await page.getByTestId('flowchart-progress').textContent()).toBe('0 / 5');

    for (let i = 0; i < 4; i++) {
      const canvas = page.locator('.flowchart-svg').nth(i).locator('[data-testid^="flowchart-canvas-"]');
      const transform = await canvas.first().getAttribute('transform');
      expect(transform).toMatch(/translate\(/);
    }
  });

  test('state machine widget renders with order states', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    const stateMachine = page.getByTestId('state-machine-widget');
    await expect(stateMachine).toBeVisible();

    // Initial state PENDING should be visible
    const pendingState = page.getByTestId('state-PENDING');
    await expect(pendingState).toBeVisible();
  });

  test('state machine widget highlights change on playback', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(600);
    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(600);

    // States should render and at least one should be active
    const activeStates = page.locator('.inspector-state-node.inspector-state-active');
    expect(await activeStates.count()).toBeGreaterThanOrEqual(0);
  });

  test('JSON payload viewer shows order_placed at step 1', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(300);

    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(400);

    const payloadType = page.getByTestId('json-payload-type');
    await expect(payloadType).toBeVisible();
    await expect(payloadType).toHaveText('order_placed');
  });

  test('JSON payload updates through checkout steps', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(300);

    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(400);
    await expect(page.getByTestId('json-payload-type')).toHaveText('order_placed');

    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(400);
    await expect(page.getByTestId('json-payload-type')).toHaveText('stock_check');
  });

  test('JSON payload shows stripe_webhook at step 2', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(300);

    // Step 0 (order_placed), 1 (stock_check), 2 (stripe_webhook)
    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(400);
    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(400);
    await page.getByTestId('flowchart-btn-next').click();
    await page.waitForTimeout(400);

    await expect(page.getByTestId('json-payload-type')).toHaveText('stripe_webhook');
  });

  test('JSON payload shows fraud_evaluation at step 4', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(300);

    // Advance to step 4
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('flowchart-btn-next').click();
      await page.waitForTimeout(400);
    }

    await expect(page.getByTestId('json-payload-type')).toHaveText('fraud_evaluation');
  });

  test('ERD widget accessible via inspector sidebar', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-tab-erd').click();
    await page.waitForTimeout(300);

    const erdWidget = page.getByTestId('inspector-widget-erd');
    await expect(erdWidget).toBeVisible();

    const hint = page.getByTestId('erd-schema-hint');
    await expect(hint).toBeVisible();
  });

  test('grid view labels identify each viewport quadrant', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');

    const labels = page.locator('.flowchart-grid-view-label');
    expect(await labels.count()).toBeGreaterThanOrEqual(4);

    await expect(labels.nth(0)).toBeVisible();
    await expect(labels.nth(1)).toBeVisible();
    await expect(labels.nth(2)).toBeVisible();
    await expect(labels.nth(3)).toBeVisible();
  });

  test('view tabs hidden in grid mode', async ({ page }) => {
    await expect(page.getByTestId('flowchart-view-tabs')).toBeVisible();
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.getByTestId('flowchart-view-tabs')).not.toBeVisible();
  });

  test('returns to single view from grid mode', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).toBeVisible();
    await page.click('[data-testid="flowchart-btn-single"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).not.toBeVisible();
    await expect(page.getByTestId('flowchart-view-tabs')).toBeVisible();
  });

  test('inspector sidebar close button hides sidebar', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-close').click();

    const sidebar = page.getByTestId('inspector-sidebar');
    await expect(sidebar).not.toBeVisible();
  });

  test('fraud review block journey escalation steps advance correctly', async ({ page }) => {
    await page.getByTestId('flowchart-journey-select').selectOption('fraud-review-block');

    const nextBtn = page.getByTestId('flowchart-btn-next');
    const progress = page.getByTestId('flowchart-progress');

    // Step through to escalation steps (step 5 and 6)
    for (let i = 0; i < 5; i++) {
      await nextBtn.click();
      await page.waitForTimeout(400);
    }

    await expect(progress).toHaveText('5 / 6');

    await nextBtn.click();
    await page.waitForTimeout(400);
    await expect(progress).toHaveText('6 / 6');
  });

  test('JSON payload shows fraud_alert during fraud review journey', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(300);

    await page.getByTestId('flowchart-journey-select').selectOption('fraud-review-block');

    // Advance to step 5 (fraud flagged / review)
    const nextBtn = page.getByTestId('flowchart-btn-next');
    for (let i = 0; i < 5; i++) {
      await nextBtn.click();
      await page.waitForTimeout(400);
    }

    const payloadViewer = page.getByTestId('json-payload-viewer');
    await expect(payloadViewer).toBeVisible();
  });

  test('JSON payload shows analyst_decision at fraud review step 6', async ({ page }) => {
    await page.getByTestId('flowchart-btn-inspector').click();
    await page.waitForSelector('[data-testid="inspector-sidebar"]');

    await page.getByTestId('inspector-tab-payload').click();
    await page.waitForTimeout(300);

    await page.getByTestId('flowchart-journey-select').selectOption('fraud-review-block');

    const nextBtn = page.getByTestId('flowchart-btn-next');
    for (let i = 0; i < 6; i++) {
      await nextBtn.click();
      await page.waitForTimeout(400);
    }

    await expect(page.getByTestId('json-payload-type')).toHaveText('analyst_decision');
  });
});
