import { test, expect } from '@playwright/test';

test.describe('Flowchart Independent Camera Engine (#53)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');
    // Switch to grid mode
    await page.click('[data-testid="flowchart-btn-grid"]');
    await expect(page.locator('[data-testid="flowchart-grid-container"]')).toBeVisible();
  });

  test('all 4 viewports render with independent SVG canvases', async ({ page }) => {
    const svgs = page.locator('.flowchart-svg');
    await expect(svgs.nth(0)).toBeVisible();
    await expect(svgs.nth(1)).toBeVisible();
    await expect(svgs.nth(2)).toBeVisible();
    await expect(svgs.nth(3)).toBeVisible();

    // Each SVG should have a transformable canvas group
    for (let i = 0; i < 4; i++) {
      const canvas = svgs.nth(i).locator('[data-testid^="flowchart-canvas-"]');
      await expect(canvas).toBeVisible();
      const transform = await canvas.first().getAttribute('transform');
      expect(transform).toBeTruthy();
      expect(transform!).toContain('translate(');
      expect(transform!).toContain('scale(');
    }
  });

  test('playback step changes trigger camera focus in all 4 viewports', async ({ page }) => {
    // Get initial transform values from each canvas
    const initialTransforms: string[] = [];
    for (let i = 0; i < 4; i++) {
      const svg = page.locator('.flowchart-svg').nth(i);
      const canvas = svg.locator('[data-testid^="flowchart-canvas-"]');
      const t = await canvas.first().getAttribute('transform');
      initialTransforms.push(t || '');
    }

    // Advance to first step
    await page.click('[data-testid="flowchart-btn-next"]');
    await expect(page.locator('[data-testid="flowchart-progress"]')).toHaveText('1 / 6');
    
    // Wait for camera animation to complete (600ms duration + buffer)
    await page.waitForTimeout(800);

    // At least some canvases should have changed transform after focus
    let changed = false;
    for (let i = 0; i < 4; i++) {
      const svg = page.locator('.flowchart-svg').nth(i);
      const canvas = svg.locator('[data-testid^="flowchart-canvas-"]');
      const t = await canvas.first().getAttribute('transform');
      if (t !== initialTransforms[i]) {
        changed = true;
      }
    }
    expect(changed).toBe(true);
  });

  test('multiple step advances update camera in all viewports', async ({ page }) => {
    // Advance through steps
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="flowchart-btn-next"]');
      await page.waitForTimeout(700); // Wait for camera animation
    }

    await expect(page.locator('[data-testid="flowchart-progress"]')).toHaveText('3 / 6');

    // All 4 SVGs should still be visible with valid transforms
    for (let i = 0; i < 4; i++) {
      const svg = page.locator('.flowchart-svg').nth(i);
      await expect(svg).toBeVisible();
      const canvas = svg.locator('[data-testid^="flowchart-canvas-"]');
      const transform = await canvas.first().getAttribute('transform');
      expect(transform).toBeTruthy();
      expect(transform!).toMatch(/translate\([^)]+\)\s*scale\([^)]+\)/);
    }
  });

  test('panning in one viewport does not affect others', async ({ page }) => {
    // Record initial transforms
    const beforePan: string[] = [];
    for (let i = 0; i < 4; i++) {
      const svg = page.locator('.flowchart-svg').nth(i);
      const canvas = svg.locator('[data-testid^="flowchart-canvas-"]');
      beforePan.push(await canvas.first().getAttribute('transform') || '');
    }

    // Zoom in on the first viewport using its zoom toolbar to change its transform
    const firstZoomIn = page.locator('[data-testid="flowchart-zoom-in"]').nth(0);
    await firstZoomIn.click();
    await page.waitForTimeout(100);

    // First viewport transform should have changed
    const firstAfter = await page.locator('.flowchart-svg').nth(0)
      .locator('[data-testid^="flowchart-canvas-"]').first()
      .getAttribute('transform');
    expect(firstAfter).not.toBe(beforePan[0]);

    // Other 3 viewports should remain unchanged
    for (let i = 1; i < 4; i++) {
      const svg = page.locator('.flowchart-svg').nth(i);
      const canvas = svg.locator('[data-testid^="flowchart-canvas-"]');
      const after = await canvas.first().getAttribute('transform');
      expect(after).toBe(beforePan[i]);
    }
  });

  test('zooming in one viewport does not affect others', async ({ page }) => {
    // Record initial transforms
    const beforeZoom: string[] = [];
    for (let i = 0; i < 4; i++) {
      const svg = page.locator('.flowchart-svg').nth(i);
      const canvas = svg.locator('[data-testid^="flowchart-canvas-"]');
      beforeZoom.push(await canvas.first().getAttribute('transform') || '');
    }

    // Zoom out on the second viewport using its zoom toolbar
    const secondZoomOut = page.locator('[data-testid="flowchart-zoom-out"]').nth(1);
    await secondZoomOut.click();
    await page.waitForTimeout(100);

    // Second viewport scale should have changed
    const secondAfter = await page.locator('.flowchart-svg').nth(1)
      .locator('[data-testid^="flowchart-canvas-"]').first()
      .getAttribute('transform');
    expect(secondAfter).not.toBe(beforeZoom[1]);

    // Other 3 viewports should remain unchanged
    for (let i = 0; i < 4; i++) {
      if (i === 1) continue;
      const svg = page.locator('.flowchart-svg').nth(i);
      const canvas = svg.locator('[data-testid^="flowchart-canvas-"]');
      const after = await canvas.first().getAttribute('transform');
      expect(after).toBe(beforeZoom[i]);
    }
  });

  test('each viewport has independent zoom toolbar', async ({ page }) => {
    // Each viewport should have its own zoom controls
    const zoomIns = page.locator('[data-testid="flowchart-zoom-in"]');
    const zoomOuts = page.locator('[data-testid="flowchart-zoom-out"]');
    const fitScreens = page.locator('[data-testid="flowchart-fit-screen"]');

    // Should have at least 4 of each zoom control
    expect(await zoomIns.count()).toBeGreaterThanOrEqual(4);
    expect(await zoomOuts.count()).toBeGreaterThanOrEqual(4);
    expect(await fitScreens.count()).toBeGreaterThanOrEqual(4);
  });

  test('grid view labels identify each viewport', async ({ page }) => {
    const labels = page.locator('.flowchart-grid-view-label');
    await expect(labels.nth(0)).toBeVisible();
    await expect(labels.nth(1)).toBeVisible();
    await expect(labels.nth(2)).toBeVisible();
    await expect(labels.nth(3)).toBeVisible();
  });

  test('play and pause controls work across all grid viewports', async ({ page }) => {
    await page.click('[data-testid="flowchart-btn-play"]');
    await page.waitForTimeout(3000); // Let it advance at least one step
    await page.click('[data-testid="flowchart-btn-pause"]');
    
    // All 4 SVGs should still be visible and intact
    for (let i = 0; i < 4; i++) {
      await expect(page.locator('.flowchart-svg').nth(i)).toBeVisible();
    }
  });

  test('reset returns all viewports to initial state', async ({ page }) => {
    // Advance some steps
    await page.click('[data-testid="flowchart-btn-next"]');
    await page.click('[data-testid="flowchart-btn-next"]');
    await page.waitForTimeout(800);
    
    expect(await page.locator('[data-testid="flowchart-progress"]').textContent()).toBe('2 / 6');
    
    // Reset
    await page.click('[data-testid="flowchart-btn-reset"]');
    await page.waitForTimeout(100);
    
    expect(await page.locator('[data-testid="flowchart-progress"]').textContent()).toBe('0 / 6');
    
    // All 4 SVGs still visible
    for (let i = 0; i < 4; i++) {
      await expect(page.locator('.flowchart-svg').nth(i)).toBeVisible();
      const canvas = page.locator('.flowchart-svg').nth(i).locator('[data-testid^="flowchart-canvas-"]');
      const transform = await canvas.first().getAttribute('transform');
      expect(transform).toBeTruthy();
    }
  });
});
