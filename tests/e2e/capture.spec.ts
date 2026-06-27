import { test } from '@playwright/test';

test('capture logs', async ({ page }) => {
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => console.error(`[pageerror] ${error.name}: ${error.message}`));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
});
