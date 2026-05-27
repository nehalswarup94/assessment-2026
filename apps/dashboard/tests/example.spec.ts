import { test, expect } from '@playwright/test';

test.describe('Induction Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Induction Dashboard' })).toBeVisible();
    await expect(page.getByText('Induction programs')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('search filters records by name or company', async ({ page }) => {
    const firstRecord = page.locator('tbody tr').first();
    await expect(firstRecord).toBeVisible();

    const fullName = (await firstRecord.locator('td').first().textContent())?.trim() ?? '';
    const searchTerm = fullName.split(' ')[0] || fullName;
    await page.getByLabel('Search').fill(searchTerm);
    await page.waitForTimeout(800);

    const filteredRows = page.locator('tbody tr');
    await expect(filteredRows.first()).toBeVisible();
    const visibleName = await filteredRows.first().locator('td').first().textContent();
    expect(visibleName?.toLowerCase()).toContain(searchTerm.toLowerCase());
  });

});
