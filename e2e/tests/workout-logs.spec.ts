import { test, expect } from '../fixtures/test-fixtures';
import {
  cleanupTestData,
  seedWorkout,
  seedWorkoutExercise,
} from '../helpers/supabase-admin';

test.describe('Workout Logs', () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test('page loads with empty state', async ({ page }) => {
    await page.goto('/workout-logs');
    await expect(page.getByText('No workout logs yet')).toBeVisible();
  });

  test('shows available workouts to start', async ({ page, testUserId }) => {
    await seedWorkout(testUserId, { name: 'Push Day' });
    await page.goto('/workout-logs');

    await expect(page.getByText('Start Any Workout')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Push Day' })).toBeVisible();
  });

  test('can start a workout and see exercises', async ({
    page,
    testUserId,
  }) => {
    const workout = await seedWorkout(testUserId, { name: 'Bench Session' });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
      sets: 3,
      reps: 10,
      weight_kg: 60,
    });

    await page.goto('/workout-logs');
    await page.getByRole('link', { name: 'Bench Session' }).click();

    // Should redirect to active workout page
    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();
    await expect(
      page.getByText('Barbell Bench Press - Medium Grip')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Complete Workout' })
    ).toBeVisible();
  });

  test('can complete a workout', async ({ page, testUserId }) => {
    const workout = await seedWorkout(testUserId, { name: 'Quick Workout' });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
      sets: 1,
      reps: 5,
    });

    await page.goto('/workout-logs');
    await page.getByRole('link', { name: 'Quick Workout' }).click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Complete Workout' }).click();

    await expect(page.getByText('Workout completed!')).toBeVisible();
  });
});
