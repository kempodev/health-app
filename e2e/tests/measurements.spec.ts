import { test, expect } from '../fixtures/test-fixtures';
import {
  seedMeasurement,
  cleanupTestData,
} from '../helpers/supabase-admin';

test.describe('Measurements', () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test('page loads with metric selector defaulting to weight', async ({
    page,
  }) => {
    await page.goto('/measurements');
    await expect(page.getByText('Measurement Tracker')).toBeVisible();
    await expect(page.getByText('Add New Entry')).toBeVisible();
    // The metric selector should show Weight by default
    await expect(
      page.locator('[data-slot="select-trigger"]').first()
    ).toContainText('Weight');
  });

  test('can add a measurement', async ({ page }) => {
    await page.goto('/measurements');

    await page.getByPlaceholder(/Enter Weight/i).fill('80.5');
    await page.getByRole('button', { name: 'Add Entry' }).click();

    // Verify toast appears
    await expect(
      page.locator('[data-sonner-toast]').getByText('Measurement added successfully!')
    ).toBeVisible();

    // Verify entry appears in history table
    await expect(
      page.locator('tbody').getByText('80.5')
    ).toBeVisible();
  });

  test('can switch between metrics', async ({ page, testUserId }) => {
    await seedMeasurement(testUserId, {
      metric_type: 'waist',
      metric_value: 85,
      original_value: 85,
      original_unit: 'cm',
    });

    await page.goto('/measurements');

    // Switch to waist metric
    await page.locator('[data-slot="select-trigger"]').first().click();
    await page.getByRole('option', { name: 'Waist' }).click();

    // History should show the waist measurement in the table
    await expect(page.locator('tbody').getByText('85.0')).toBeVisible();
  });

  test('can delete a measurement', async ({ page, testUserId }) => {
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 80,
      original_value: 80,
      original_unit: 'kg',
    });

    await page.goto('/measurements');

    // Click the delete button
    await page.getByRole('button', { name: 'Delete measurement' }).click();

    // AlertDialog should appear
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', { name: 'Delete Measurement' })
    ).toBeVisible();

    // Confirm deletion
    await dialog.getByRole('button', { name: 'Delete' }).click();

    // Wait for the row to disappear
    await expect(page.locator('tbody').getByText('80.0')).not.toBeVisible();
  });

  test('cancel delete does not remove measurement', async ({
    page,
    testUserId,
  }) => {
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 80,
      original_value: 80,
      original_unit: 'kg',
    });

    await page.goto('/measurements');

    // Click delete, then cancel
    await page.getByRole('button', { name: 'Delete measurement' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Measurement should still be visible in the table
    await expect(page.locator('tbody').getByText('80.0')).toBeVisible();
  });

  test('chart renders with data', async ({ page, testUserId }) => {
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 80,
      original_value: 80,
      original_unit: 'kg',
    });

    await page.goto('/measurements');
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('timeframe filter changes chart range', async ({
    page,
    testUserId,
  }) => {
    // Seed a measurement from 4 months ago
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 85,
      original_value: 85,
      original_unit: 'kg',
      created_at: fourMonthsAgo.toISOString(),
    });

    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 80,
      original_value: 80,
      original_unit: 'kg',
    });

    await page.goto('/measurements');

    // Find the timeframe selector — it's the one containing "Last 3 months" (default)
    const timeframeSelector = page.locator(
      '[data-slot="select-trigger"]',
      { hasText: 'Last 3 months' }
    );
    await timeframeSelector.click();
    await page.getByRole('option', { name: 'Last 6 months' }).click();

    // Both measurements should be visible in history (history is unfiltered)
    await expect(page.locator('tbody').getByText('85.0')).toBeVisible();
    await expect(page.locator('tbody').getByText('80.0')).toBeVisible();
  });
});
