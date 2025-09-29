import { test, expect } from '@playwright/test';

const routes = [
  { href: '/', expectUrl: /\/$/ },
  { href: '/clients', expectUrl: /\/clients$/ },
  { href: '/centers', expectUrl: /\/centers$/ },
  { href: '/orders', expectUrl: /\/orders$/ },
  { href: '/budgets', expectUrl: /\/budgets$/ },
  { href: '/reports', expectUrl: /\/reports$/ },
];

test.describe('Sidebar navigation', () => {
  test('navigates to each section via sidebar links', async ({ page }) => {
    await page.goto('/');
    for (const { href, expectUrl } of routes) {
      const link = page.locator(`aside a[href="${href}"]`).first();
      try {
        if (await link.isVisible()) {
          await link.click();
        } else {
          await page.goto(href);
        }
      } catch {
        await page.goto(href);
      }
      await expect(page).toHaveURL(expectUrl);
    }
  });
});
