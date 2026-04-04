import { test, expect } from '../fixtures/test-fixtures';
import {
  cleanupTestData,
  seedSchedule,
  seedScheduleEntry,
  seedWorkout,
  seedWorkoutExercise,
} from '../helpers/supabase-admin';

// Get today's day_of_week in our format (0=Mon)
function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Get a day_of_week that is NOT today
function getOtherDayOfWeek(): number {
  return (getTodayDayOfWeek() + 1) % 7;
}

test.describe('Workout Logs', () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test('page loads with empty state', async ({ page }) => {
    await page.goto('/workout-logs');
    await expect(page.getByText('No workout logs yet')).toBeVisible();
  });

  test('shows available workouts to start', async ({ page, testUserId }) => {
    const workout = await seedWorkout(testUserId, { name: 'Push Day' });
    const schedule = await seedSchedule(testUserId, { is_active: true });
    await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getOtherDayOfWeek(),
    });

    await page.goto('/workout-logs');

    await expect(page.getByText('Other Workouts')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Push Day' })
    ).toBeVisible();
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
    const schedule = await seedSchedule(testUserId, { is_active: true });
    await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getTodayDayOfWeek(),
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Bench Session' }).click();
    // Confirm the start dialog
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

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
    const schedule = await seedSchedule(testUserId, { is_active: true });
    await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getTodayDayOfWeek(),
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Quick Workout' }).click();
    // Confirm the start dialog
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Complete Workout' }).click();

    await expect(page.getByText('Workout completed!')).toBeVisible();
  });
});
