import { test, expect } from '@playwright/test';

test.describe('Flowchart Grid Layout', () => {
  test('displays layout toggle buttons in header', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await expect(page.locator('[data-testid="flowchart-layout-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="flowchart-btn-single"]')).toBeVisible();
    await expect(page.locator('[data-testid="flowchart-btn-grid"]')).toBeVisible();
  });

  test('switches to grid view showing 4 diagrams', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).toBeVisible();
    const svgs = page.locator('.flowchart-svg');
    await expect(svgs.first()).toBeVisible();
  });

  test('view tabs hidden in grid mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await expect(page.locator('[data-testid="flowchart-view-tabs"]')).toBeVisible();
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.locator('[data-testid="flowchart-view-tabs"]')).not.toBeVisible();
  });

  test('returns to single view mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).toBeVisible();
    await page.click('[data-testid="flowchart-btn-single"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="flowchart-view-tabs"]')).toBeVisible();
  });

  test('playback highlights nodes across grid views', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.click('[data-testid="flowchart-btn-grid"]');
    await page.click('[data-testid="flowchart-btn-next"]');
    const progress = page.locator('[data-testid="flowchart-progress"]');
    await expect(progress).toHaveText('1 / 6');
  });

  test('viewport resize below 1024px resets to single mode', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).toBeVisible();
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).not.toBeVisible();
  });

  test('grid view labels visible for each quadrant', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    await page.click('[data-testid="flowchart-btn-grid"]');
    const labels = page.locator('.flowchart-grid-view-label');
    await expect(labels.first()).toBeVisible();
  });
});
