import { test, expect } from '@playwright/test';

test('open visual search from hub', async ({ page }) => {
  const ports = [5173, 5174, 5175];
  let visited = false;
  for (const p of ports) {
    try {
      // open the selective hub route directly
      await page.goto(`http://localhost:${p}/#/treinar/seletiva`, { timeout: 5000 });
      await page.waitForSelector('text=Caça ao Alvo', { timeout: 3000 });
      visited = true;
      break;
    } catch (e) {
      // try next port
    }
  }

  if (!visited) {
    throw new Error('Dev server not reachable on ports 5173-5175 at /treinar/seletiva');
  }

  // open the interactive card
  await page.click('text=Caça ao Alvo');
  await page.waitForSelector('text=COMEÇAR FASE', { timeout: 5000 });
  const visible = await page.isVisible('text=COMEÇAR FASE');
  expect(visible).toBeTruthy();
});
