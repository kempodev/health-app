import { test, expect } from '../fixtures/test-fixtures';
import {
  cleanupTestData,
  seedSchedule,
  seedScheduleEntry,
  seedWorkout,
  seedWorkoutExercise,
  seedWorkoutLog,
  seedWorkoutLogExercise,
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
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Complete' })
      .click();

    await expect(page.getByText('Workout completed!')).toBeVisible();
  });

  test('pre-fills reps/weight/sets from prior completed session in same schedule', async ({
    page,
    testUserId,
  }) => {
    const workout = await seedWorkout(testUserId, { name: 'Leg Day' });
    // Template defaults: 3 sets x 10 reps @ 60kg
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      sets: 3,
      reps: 10,
      weight_kg: 60,
    });
    const schedule = await seedSchedule(testUserId, { is_active: true });
    const entry = await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getTodayDayOfWeek(),
    });

    // Seed a prior completed session with 4 sets, different reps/weights
    const priorLog = await seedWorkoutLog(testUserId, workout.id, entry.id, {
      name: 'Leg Day',
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      set_number: 1,
      reps: 8,
      weight_kg: 80,
    });
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      set_number: 2,
      reps: 8,
      weight_kg: 80,
    });
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      set_number: 3,
      reps: 6,
      weight_kg: 85,
    });
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      set_number: 4,
      reps: 5,
      weight_kg: 85,
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Leg Day' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();

    // Prior session had 4 sets — new session should also have 4
    const repsInputs = page.getByPlaceholder('Reps');
    await expect(repsInputs).toHaveCount(4);

    // Verify first set carries prior reps (8) and weight (80), not template defaults
    await expect(repsInputs.nth(0)).toHaveValue('8');
    await expect(repsInputs.nth(2)).toHaveValue('6');

    const weightInputs = page.getByPlaceholder('kg');
    await expect(weightInputs.nth(0)).toHaveValue('80');
    await expect(weightInputs.nth(2)).toHaveValue('85');
  });

  test('pre-fills from prior log even when schedule_entry_id is null', async ({
    page,
    testUserId,
  }) => {
    // Simulates a legacy log (or one started from "Other Workouts") whose
    // schedule_entry_id is null — either because it was never set, or because
    // ON DELETE SET NULL fired when the schedule was edited.
    const workout = await seedWorkout(testUserId, { name: 'Push Day' });
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

    const priorLog = await seedWorkoutLog(testUserId, workout.id, null, {
      name: 'Push Day',
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
      set_number: 1,
      reps: 5,
      weight_kg: 100,
    });
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
      set_number: 2,
      reps: 5,
      weight_kg: 100,
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Push Day' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();

    const repsInputs = page.getByPlaceholder('Reps');
    await expect(repsInputs).toHaveCount(2);
    await expect(repsInputs.nth(0)).toHaveValue('5');
    await expect(page.getByPlaceholder('kg').nth(0)).toHaveValue('100');
  });

  test('uses template defaults when no prior session exists in schedule', async ({
    page,
    testUserId,
  }) => {
    const workout = await seedWorkout(testUserId, { name: 'Fresh Workout' });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
      sets: 2,
      reps: 12,
      weight_kg: 50,
    });
    const schedule = await seedSchedule(testUserId, { is_active: true });
    await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getTodayDayOfWeek(),
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Fresh Workout' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();

    const repsInputs = page.getByPlaceholder('Reps');
    await expect(repsInputs).toHaveCount(2);
    await expect(repsInputs.nth(0)).toHaveValue('12');
    await expect(page.getByPlaceholder('kg').nth(0)).toHaveValue('50');
  });
});
