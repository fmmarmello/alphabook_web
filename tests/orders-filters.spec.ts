import { test, expect } from '@playwright/test';

test.describe('Orders filters', () => {
  test('updates list using date range and search', async ({ page }) => {
    await page.goto('/orders');

    // Wait for initial load to call the API once
    await page.waitForRequest((r) => r.url().includes('/api/orders'));

    const from = '2024-01-01';
    const to = '2024-12-31';

    // Type search text (if search input exists)
    const search = page.getByPlaceholder('Pesquisar');
    if (await search.isVisible()) {
      await search.fill('AlphaTest');
    }

    // Set date filters
    const waiter = page.waitForRequest((r) =>
      r.url().includes('/api/orders') && r.url().includes(`dateFrom=${from}`) && r.url().includes(`dateTo=${to}`)
    );

    await page.locator('xpath=//label[normalize-space()="De:"]/following-sibling::input').fill(from);
    await page.locator('xpath=//label[normalize-space()="Até:"]/following-sibling::input').fill(to);

    await waiter;

    // Assert table is present (data may be empty but structure should render)
    await expect(page.locator('table')).toBeVisible();
  });
});
