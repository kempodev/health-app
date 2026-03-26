import { test, expect } from '../fixtures/test-fixtures';
import {
  seedMeasurement,
  seedTarget,
  cleanupTestData,
} from '../helpers/supabase-admin';

test.describe('Dashboard', () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test('displays welcome message', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Welcome to the dashboard')).toBeVisible();
  });

  test('shows measurement cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: 'Weight' })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: 'Waist' })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: 'Body Fat' })
    ).toBeVisible();
  });

  test('shows empty state when no measurements exist', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(
      page.getByText('No weight recorded yet.')
    ).toBeVisible();
  });

  test('displays latest measurement value', async ({ page, testUserId }) => {
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 82.5,
      original_value: 82.5,
      original_unit: 'kg',
    });

    await page.goto('/dashboard');
    await expect(page.getByText('82.5')).toBeVisible();
  });

  test('displays target value when set', async ({ page, testUserId }) => {
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 82.5,
      original_value: 82.5,
      original_unit: 'kg',
    });
    await seedTarget(testUserId, {
      metric_type: 'weight',
      value: 75,
      unit: 'kg',
    });

    await page.goto('/dashboard');
    await expect(page.getByText('Target')).toBeVisible();
    await expect(page.getByText('75')).toBeVisible();
  });

  test('shows change delta when multiple measurements exist', async ({
    page,
    testUserId,
  }) => {
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 85,
      original_value: 85,
      original_unit: 'kg',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    });
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 82.5,
      original_value: 82.5,
      original_unit: 'kg',
    });

    await page.goto('/dashboard');
    await expect(page.getByText('Change since previous')).toBeVisible();
  });

  test('update button links to measurements page', async ({ page }) => {
    await page.goto('/dashboard');
    const updateButton = page.getByRole('link', { name: /Update Weight/i });
    await expect(updateButton).toBeVisible();
    await updateButton.click();
    await expect(page).toHaveURL('/measurements');
  });
});
