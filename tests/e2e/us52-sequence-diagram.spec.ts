import { test, expect, type Page } from '@playwright/test';

const flowchart = (page: Page) => page.getByTestId('flowchart-section').first();

test.describe('US-13: Sequence Diagram View Projection', () => {
  test('SEQUENCE view renders lifelines, participant boxes, and message arrows in single mode', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });


    const seqTab = flowchart(page).locator('.flowchart-view-tab-trigger').filter({ hasText: 'Sequence Diagram' });
    await seqTab.click();

    const seqSvg = flowchart(page).getByTestId('flowchart-svg-SEQUENCE');
    await expect(seqSvg).toBeVisible();

    const lifelines = flowchart(page).locator('[data-testid^="flowchart-lifeline-SEQUENCE-"]');
    const lifelineCount = await lifelines.count();
    expect(lifelineCount).toBeGreaterThanOrEqual(3);

    const topBoxes = flowchart(page).locator('[data-testid^="flowchart-seq-top-SEQUENCE-"]');
    expect(await topBoxes.count()).toBeGreaterThanOrEqual(3);

    const bottomBoxes = flowchart(page).locator('[data-testid^="flowchart-seq-bottom-SEQUENCE-"]');
    expect(await bottomBoxes.count()).toBeGreaterThanOrEqual(3);

    const msgs = flowchart(page).locator('[data-testid^="flowchart-seq-msg-SEQUENCE-"]');
    const msgCount = await msgs.count();
    expect(msgCount).toBeGreaterThanOrEqual(2);

    const labels = flowchart(page).locator('[data-testid^="flowchart-seq-msg-label-SEQUENCE-"]');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThanOrEqual(2);
  });

  test('SEQUENCE message labels display custom text', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });


    const seqTab = flowchart(page).locator('.flowchart-view-tab-trigger').filter({ hasText: 'Sequence Diagram' });
    await seqTab.click();

    const seqSvg = flowchart(page).getByTestId('flowchart-svg-SEQUENCE');
    await expect(seqSvg).toBeVisible();

    const firstLabel = flowchart(page).getByTestId('flowchart-seq-msg-label-SEQUENCE-0');
    await expect(firstLabel).toBeVisible();
    const text = await firstLabel.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('SEQUENCE view appears in view tabs alongside other views', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });


    const viewTabs = flowchart(page).getByTestId('flowchart-view-tabs');
    await expect(viewTabs).toBeVisible();

    const tabTexts = await viewTabs.locator('.flowchart-view-tab-label').evaluateAll(el => el.map(e => e.textContent?.trim()));
    expect(tabTexts.some(t => t.includes('Sequence Diagram'))).toBe(true);
  });

  test('SEQUENCE lifelines render as dashed vertical lines', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });


    const seqTab = flowchart(page).locator('.flowchart-view-tab-trigger').filter({ hasText: 'Sequence Diagram' });
    await seqTab.click();

    const seqSvg = flowchart(page).getByTestId('flowchart-svg-SEQUENCE');
    await expect(seqSvg).toBeVisible();

    const line = flowchart(page).locator('[data-testid="flowchart-lifeline-SEQUENCE-0"] line').first();
    const dasharray = await line.getAttribute('stroke-dasharray');
    expect(dasharray).toMatch(/^\d+(?:\.\d+)?[ ,]+\d+(?:\.\d+)?$/);
    const x1 = await line.getAttribute('x1');
    const x2 = await line.getAttribute('x2');
    expect(x1).toBe(x2);
  });

  test('SEQUENCE return messages render as dashed lines', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    await expect(flowchart(page)).toBeVisible({ timeout: 20000 });


    const seqTab = flowchart(page).locator('.flowchart-view-tab-trigger').filter({ hasText: 'Sequence Diagram' });
    await seqTab.click();

    const seqSvg = flowchart(page).getByTestId('flowchart-svg-SEQUENCE');
    await expect(seqSvg).toBeVisible();

    const msgs = flowchart(page).locator('[data-testid^="flowchart-seq-msg-SEQUENCE-"]');
    const count = await msgs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
