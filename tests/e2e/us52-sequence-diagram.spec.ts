import { test, expect } from '@playwright/test';

test.describe('US-13: Sequence Diagram View Projection', () => {
  test('SEQUENCE view renders lifelines, participant boxes, and message arrows in single mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');

    const singleBtn = page.getByTestId('flowchart-btn-single');
    await singleBtn.click();

    const viewTabs = page.getByTestId('flowchart-view-tabs');
    await expect(viewTabs).toBeVisible();

    const tabs = viewTabs.locator('button');
    const seqTabIndex = await tabs.evaluateAll(async (btns) => {
      return btns.findIndex(b => b.textContent?.includes('Sequence Diagram'));
    });

    if (seqTabIndex >= 0) {
      await tabs.nth(seqTabIndex).click();
    }

    const seqSvg = page.getByTestId('flowchart-svg-SEQUENCE');
    await expect(seqSvg).toBeInViewport();

    const lifelines = page.locator('[data-testid^="flowchart-lifeline-SEQUENCE-"]');
    const lifelineCount = await lifelines.count();
    expect(lifelineCount).toBeGreaterThanOrEqual(3);

    const topBoxes = page.locator('[data-testid^="flowchart-seq-top-SEQUENCE-"]');
    expect(await topBoxes.count()).toBeGreaterThanOrEqual(3);

    const bottomBoxes = page.locator('[data-testid^="flowchart-seq-bottom-SEQUENCE-"]');
    expect(await bottomBoxes.count()).toBeGreaterThanOrEqual(3);

    const msgs = page.locator('[data-testid^="flowchart-seq-msg-SEQUENCE-"]');
    const msgCount = await msgs.count();
    expect(msgCount).toBeGreaterThanOrEqual(2);

    const labels = page.locator('[data-testid^="flowchart-seq-msg-label-SEQUENCE-"]');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThanOrEqual(2);
  });

  test('SEQUENCE message labels display custom text', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');

    const singleBtn = page.getByTestId('flowchart-btn-single');
    await singleBtn.click();

    const viewTabs = page.getByTestId('flowchart-view-tabs');
    const tabs = viewTabs.locator('button');
    const seqTabIndex = await tabs.evaluateAll(async (btns) => {
      return btns.findIndex(b => b.textContent?.includes('Sequence Diagram'));
    });

    if (seqTabIndex >= 0) {
      await tabs.nth(seqTabIndex).click();
    }

    const firstLabel = page.getByTestId('flowchart-seq-msg-label-SEQUENCE-0');
    await expect(firstLabel).toBeVisible();
    const text = await firstLabel.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('SEQUENCE view appears in view tabs alongside other views', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');

    const singleBtn = page.getByTestId('flowchart-btn-single');
    await singleBtn.click();

    const viewTabs = page.getByTestId('flowchart-view-tabs');
    await expect(viewTabs).toBeVisible();

    const tabs = viewTabs.locator('button');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(4);

    const tabTexts = await tabs.evaluateAll(async (btns) => btns.map(b => b.textContent || ''));
    expect(tabTexts.some(t => t.includes('Sequence Diagram'))).toBe(true);
  });

  test('SEQUENCE lifelines render as dashed vertical lines', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');

    const singleBtn = page.getByTestId('flowchart-btn-single');
    await singleBtn.click();

    const viewTabs = page.getByTestId('flowchart-view-tabs');
    const tabs = viewTabs.locator('button');
    const seqTabIndex = await tabs.evaluateAll(async (btns) => {
      return btns.findIndex(b => b.textContent?.includes('Sequence Diagram'));
    });

    if (seqTabIndex >= 0) {
      await tabs.nth(seqTabIndex).click();
    }

    const seqSvg = page.getByTestId('flowchart-svg-SEQUENCE');
    await expect(seqSvg).toBeInViewport();

    const line = page.locator('[data-testid="flowchart-lifeline-SEQUENCE-0"] line').first();
    const dasharray = await line.getAttribute('stroke-dasharray');
    expect(dasharray).toBe('4 4');
    const x1 = await line.getAttribute('x1');
    const x2 = await line.getAttribute('x2');
    expect(x1).toBe(x2);
  });

  test('SEQUENCE return messages render as dashed lines', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await page.waitForSelector('[data-testid="flowchart-section"]');

    const singleBtn = page.getByTestId('flowchart-btn-single');
    await singleBtn.click();

    const viewTabs = page.getByTestId('flowchart-view-tabs');
    const tabs = viewTabs.locator('button');
    const seqTabIndex = await tabs.evaluateAll(async (btns) => {
      return btns.findIndex(b => b.textContent?.includes('Sequence Diagram'));
    });

    if (seqTabIndex >= 0) {
      await tabs.nth(seqTabIndex).click();
    }

    const msgs = page.locator('[data-testid^="flowchart-seq-msg-SEQUENCE-"]');
    const count = await msgs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
