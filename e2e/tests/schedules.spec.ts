import { test, expect } from '../fixtures/test-fixtures';
import {
  cleanupTestData,
  seedSchedule,
  seedWorkout,
} from '../helpers/supabase-admin';

test.describe('Schedules', () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test('page loads with empty state', async ({ page }) => {
    await page.goto('/schedules');
    await expect(page.getByText('No schedules yet')).toBeVisible();
  });

  test('can create a new schedule', async ({ page }) => {
    await page.goto('/schedules/new');
    await page.getByLabel('Name').fill('PPL Split');
    await page.getByRole('button', { name: 'Create Schedule' }).click();

    await expect(page.getByText('Schedule created')).toBeVisible();
    await expect(page.getByText('Weekly Plan')).toBeVisible();
  });

  test('can set a schedule as active', async ({ page, testUserId }) => {
    await seedSchedule(testUserId, { name: 'My Plan' });
    await page.goto('/schedules');

    // Open the dropdown menu first
    await page.getByRole('button', { name: 'More actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Set Active' }).click();
    await expect(page.getByText('"My Plan" is now active')).toBeVisible();
  });

  test('can assign workout to a day', async ({ page, testUserId }) => {
    const workout = await seedWorkout(testUserId, { name: 'Push Day' });
    const schedule = await seedSchedule(testUserId, { name: 'Weekly Plan' });
    await page.goto(`/schedules/${schedule.id}`);

    // Click Add on Monday slot
    const mondaySlot = page.getByText('Monday').locator('..');
    await mondaySlot.getByRole('button', { name: 'Add' }).click();

    // Click the select trigger to open dropdown
    await mondaySlot.getByRole('combobox').click();

    // Select the workout from the listbox
    await page.getByRole('listbox').getByText('Push Day').click();

    // Workout should appear in the day slot
    await expect(
      mondaySlot.getByText('Push Day')
    ).toBeVisible();
  });

  test('can delete a schedule', async ({ page, testUserId }) => {
    await seedSchedule(testUserId, { name: 'Old Plan' });
    await page.goto('/schedules');

    // Open the dropdown menu first
    await page.getByRole('button', { name: 'More actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    // Confirm in the alert dialog
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    await expect(page.getByText('Deleted "Old Plan"')).toBeVisible();
  });
});
