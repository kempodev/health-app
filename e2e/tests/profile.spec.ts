import { test, expect } from '../fixtures/test-fixtures';
import { cleanupTestData, seedTarget } from '../helpers/supabase-admin';

test.describe('Profile', () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test('page loads with preferences and targets forms', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('Profile Settings')).toBeVisible();
    await expect(page.getByText('Measurement Preferences')).toBeVisible();
    await expect(page.getByText('Measurement Targets')).toBeVisible();
  });

  test('can change weight unit preference', async ({ page }) => {
    await page.goto('/profile');

    // Click the weight unit selector
    const weightSelect = page
      .locator('#preferences-form [data-slot="select-trigger"]')
      .first();
    await weightSelect.click();
    await page.getByRole('option', { name: 'Pounds (lbs)' }).click();

    // Save preferences
    await page.getByRole('button', { name: 'Save Preferences' }).click();

    // Verify toast
    await expect(
      page.locator('[data-sonner-toast]').getByText('Preferences saved successfully!')
    ).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    const weightTrigger = page
      .locator('#preferences-form [data-slot="select-trigger"]')
      .first();
    await expect(weightTrigger).toContainText('Pounds (lbs)');
  });

  test('can change length unit preference', async ({ page }) => {
    await page.goto('/profile');

    // Click the length unit selector (second select in the form)
    const lengthSelect = page
      .locator('#preferences-form [data-slot="select-trigger"]')
      .nth(1);
    await lengthSelect.click();
    await page.getByRole('option', { name: 'Inches (in)' }).click();

    // Save
    await page.getByRole('button', { name: 'Save Preferences' }).click();

    await expect(
      page.locator('[data-sonner-toast]').getByText('Preferences saved successfully!')
    ).toBeVisible();

    // Reload and verify
    await page.reload();
    const lengthTrigger = page
      .locator('#preferences-form [data-slot="select-trigger"]')
      .nth(1);
    await expect(lengthTrigger).toContainText('Inches (in)');
  });

  test('can set a measurement target', async ({ page }) => {
    await page.goto('/profile');

    // Set a weight target
    const weightTargetInput = page.getByLabel('Weight Target');
    await weightTargetInput.fill('75');

    // Save targets
    await page.getByRole('button', { name: 'Save Targets' }).click();

    await expect(
      page.locator('[data-sonner-toast]').getByText('Targets saved successfully')
    ).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByLabel('Weight Target')).toHaveValue('75');
  });

  test('can clear a target by setting to 0', async ({ page, testUserId }) => {
    // Seed an existing target
    await seedTarget(testUserId, {
      metric_type: 'weight',
      value: 75,
      unit: 'kg',
    });

    await page.goto('/profile');

    // The target should be pre-filled
    await expect(page.getByLabel('Weight Target')).toHaveValue('75');

    // Clear it by setting to 0
    await page.getByLabel('Weight Target').fill('0');

    // Save
    await page.getByRole('button', { name: 'Save Targets' }).click();

    await expect(
      page.locator('[data-sonner-toast]').getByText('Targets saved successfully')
    ).toBeVisible();

    // Reload - target should be 0 (cleared)
    await page.reload();
    await expect(page.getByLabel('Weight Target')).toHaveValue('0');
  });

  test('target appears on dashboard after setting', async ({
    page,
    testUserId,
  }) => {
    // Seed a measurement so the card shows data
    const { seedMeasurement } = await import('../helpers/supabase-admin');
    await seedMeasurement(testUserId, {
      metric_type: 'weight',
      metric_value: 82,
      original_value: 82,
      original_unit: 'kg',
    });

    // Set a target via the profile page
    await page.goto('/profile');
    await page.getByLabel('Weight Target').fill('75');
    await page.getByRole('button', { name: 'Save Targets' }).click();
    await expect(
      page.locator('[data-sonner-toast]').getByText('Targets saved successfully')
    ).toBeVisible();

    // Navigate to dashboard and verify target shows
    await page.goto('/dashboard');
    await expect(page.getByText('Target')).toBeVisible();
    await expect(page.getByText('75')).toBeVisible();
  });
});
