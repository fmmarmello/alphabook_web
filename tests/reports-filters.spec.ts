import { test, expect } from '@playwright/test';

test.describe('Reports filters', () => {
  test('selects date range via calendar and generates report', async ({ page }) => {
    await page.goto('/reports');

    // Open the Período popover
    const periodBtn = page.getByRole('button', { name: /Selecionar datas|Período/i });
    await periodBtn.click();

    // Pick two days in the calendar popover (by index for stability)
    const pop = page.locator('[data-slot="popover-content"]').last();
    await pop.waitFor();
    const days = pop.locator('button[aria-label]');
    await expect(days.first()).toBeVisible();
    const total = await days.count();
    await days.nth(Math.min(10, total - 1)).click();
    await days.nth(Math.min(15, total - 1)).click();

    // Close the popover to avoid overlay intercepting clicks
    await page.keyboard.press('Escape');

    // Generate report and ensure backend is called
    const reqWait = page.waitForRequest((r) => r.url().includes('/api/reports/production'));
    await page.getByRole('button', { name: /Gerar Relatório/i }).click();
    await reqWait;

    // Clear filters
    await page.getByRole('button', { name: /Limpar/i }).click();
    await expect(periodBtn).toHaveText(/Selecionar datas/i);
  });
});
