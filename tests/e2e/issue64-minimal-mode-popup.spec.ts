import { test, expect } from '@playwright/test';

test.describe('Flowchart minimal and fullscreen modes', () => {
  test('node details open in fullscreen', async ({ page }) => {
    await page.goto('/#/demo/ai-agent');
    const flowchart = page.getByTestId('flowchart-section').first();
    const node = flowchart.getByTestId('flowchart-node-EVENT_STORMING-dev_user');
    await expect(node).toBeVisible({ timeout: 20000 });
    await expect(node).toHaveCSS('cursor', 'default');
    await node.click();
    await expect(flowchart.getByTestId('inspector-sidebar')).not.toBeVisible();
    await expect(flowchart.getByTestId('flowchart-node-popup')).not.toBeVisible();
    await flowchart.getByTestId('flowchart-fullscreen-toggle').click();
    await expect(flowchart).toHaveClass(/fullscreen/);
    await node.click();
    await expect(flowchart.getByTestId('inspector-sidebar')).toBeVisible();
    await expect(flowchart.getByTestId('inspector-tab-details')).toHaveClass(/active/);
  });
});
