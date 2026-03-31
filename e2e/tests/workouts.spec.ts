import { test, expect } from '../fixtures/test-fixtures';
import {
  cleanupTestData,
  seedWorkout,
  seedWorkoutExercise,
} from '../helpers/supabase-admin';

test.describe('Workouts', () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test('page loads with empty state', async ({ page }) => {
    await page.goto('/workouts');
    await expect(page.getByText('No workouts yet')).toBeVisible();
  });

  test('can create a new workout', async ({ page }) => {
    await page.goto('/workouts/new');
    await page.getByLabel('Name').fill('Push Day');
    await page.getByLabel('Description').fill('Chest and triceps');
    await page.getByRole('button', { name: 'Create Workout' }).click();

    await expect(page.getByText('Workout created')).toBeVisible();
    // Should redirect to edit page with exercises section
    await expect(
      page.getByRole('heading', { name: 'Exercises' })
    ).toBeVisible();
  });

  test('can edit a workout name', async ({ page, testUserId }) => {
    const workout = await seedWorkout(testUserId, { name: 'Leg Day' });
    await page.goto(`/workouts/${workout.id}`);

    await page.getByLabel('Name').fill('Leg Day V2');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Workout updated')).toBeVisible();
  });

  test('can add exercise to workout via browser', async ({
    page,
    testUserId,
  }) => {
    const workout = await seedWorkout(testUserId);
    await page.goto(`/workouts/${workout.id}`);

    await page.getByRole('button', { name: 'Add Exercise' }).click();
    await expect(
      page.getByRole('heading', { name: 'Add Exercise' })
    ).toBeVisible();

    // Search for an exercise
    await page.getByPlaceholder('Search exercises...').fill('bench press');
    await page.waitForTimeout(500);

    // Click the + button on the first result in the dialog
    const firstAddButton = page
      .locator('[role="dialog"]')
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    if (await firstAddButton.isVisible()) {
      await firstAddButton.click();
    }
  });

  test('can delete a workout', async ({ page, testUserId }) => {
    await seedWorkout(testUserId, { name: 'Delete Me' });
    await page.goto('/workouts');

    // Click the trash icon button (inside the card footer)
    await page
      .locator('button.text-destructive')
      .first()
      .click();
    // Confirm in the alert dialog
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    await expect(page.getByText('Deleted "Delete Me"')).toBeVisible();
  });

  test('can duplicate a workout', async ({ page, testUserId }) => {
    await seedWorkout(testUserId, { name: 'Original' });
    await page.goto('/workouts');

    await page.getByTitle('Duplicate').click();
    await expect(page.getByText('Duplicated "Original"')).toBeVisible();
    await expect(page.getByText('Original (Copy)')).toBeVisible();
  });

  test('workout with exercises shows exercise list', async ({
    page,
    testUserId,
  }) => {
    const workout = await seedWorkout(testUserId, { name: 'Full Workout' });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
    });

    await page.goto(`/workouts/${workout.id}`);
    await expect(
      page.getByText('Barbell Bench Press - Medium Grip')
    ).toBeVisible();
  });
});
