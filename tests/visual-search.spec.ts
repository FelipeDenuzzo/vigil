import { test, expect } from '@playwright/test';

test('open visual search from hub', async ({ page }) => {
  // navigate to training selection
  await page.goto('http://localhost:5173/#/treinar');

  // wait for the selective hub card and click it
  await page.waitForSelector('text=Caça ao Alvo', { timeout: 5000 });
  await page.click('text=Caça ao Alvo');

  // expect VisualSearchHunt to mount and show start button
  await page.waitForSelector('text=COMEÇAR FASE', { timeout: 5000 });
  const visible = await page.isVisible('text=COMEÇAR FASE');
  expect(visible).toBeTruthy();
});
