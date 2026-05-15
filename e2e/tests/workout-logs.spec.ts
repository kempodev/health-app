import { test, expect } from '../fixtures/test-fixtures';
import {
  cleanupTestData,
  seedPreference,
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

  test('pre-fills carry over when exercises are reordered in template', async ({
    page,
    testUserId,
  }) => {
    // Template: Bench at position 0, Squat at position 1.
    // Prior log: SAME exercises in OPPOSITE order — Squat at 0, Bench at 1.
    // Carry-over should follow the exercise, not the position.
    const workout = await seedWorkout(testUserId, { name: 'Mixed Day' });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
      sets: 3,
      reps: 10,
      weight_kg: 60,
    });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Squat',
      position: 1,
      sets: 3,
      reps: 10,
      weight_kg: 60,
    });
    const schedule = await seedSchedule(testUserId, { is_active: true });
    const entry = await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getTodayDayOfWeek(),
    });

    const priorLog = await seedWorkoutLog(testUserId, workout.id, entry.id, {
      name: 'Mixed Day',
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    // Prior log: Squat at position 0 with reps=5/weight=120
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      set_number: 1,
      reps: 5,
      weight_kg: 120,
    });
    // Prior log: Bench at position 1 with reps=8/weight=85
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 1,
      set_number: 1,
      reps: 8,
      weight_kg: 85,
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Mixed Day' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();

    // Bench (template position 0) auto-expands first.
    // Its prior values came from prior position 1: reps=8, weight=85.
    const repsInputs = page.getByPlaceholder('Reps');
    const weightInputs = page.getByPlaceholder('kg');
    await expect(repsInputs).toHaveCount(1);
    await expect(repsInputs.nth(0)).toHaveValue('8');
    await expect(weightInputs.nth(0)).toHaveValue('85');

    // Expand Squat (template position 1).
    // Its prior values came from prior position 0: reps=5, weight=120.
    await page.getByText('Barbell Squat').click();
    await expect(repsInputs).toHaveCount(1);
    await expect(repsInputs.nth(0)).toHaveValue('5');
    await expect(weightInputs.nth(0)).toHaveValue('120');
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

  test('per-exercise note carries over from prior completed log', async ({
    page,
    testUserId,
  }) => {
    const workout = await seedWorkout(testUserId, { name: 'Note Day' });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      sets: 2,
      reps: 10,
      weight_kg: 60,
    });
    const schedule = await seedSchedule(testUserId, { is_active: true });
    const entry = await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getTodayDayOfWeek(),
    });

    const priorLog = await seedWorkoutLog(testUserId, workout.id, entry.id, {
      name: 'Note Day',
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    // Note lives on the set_number = 1 row.
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      set_number: 1,
      reps: 8,
      weight_kg: 80,
      notes: 'Increase reps next time',
    });
    await seedWorkoutLogExercise(priorLog.id, {
      exercise_id: 'Barbell_Squat',
      position: 0,
      set_number: 2,
      reps: 8,
      weight_kg: 80,
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Note Day' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();

    // Open the note sheet via the edit-note button and confirm the carried text.
    await page.getByRole('button', { name: 'Edit note' }).click();
    await expect(
      page.getByPlaceholder('e.g. Increase reps next time, form felt good')
    ).toHaveValue('Increase reps next time');
  });

  test('weight input survives collapse/expand under lbs preference', async ({
    page,
    testUserId,
  }) => {
    // Regression: optimistic state used to store the typed lbs value into
    // weight_kg as-is. After the inner LogSetRow remounted (collapse +
    // expand), it re-converted that "kg" value to lbs for display,
    // inflating the field (e.g. 100 → 220.5). A subsequent edit then
    // wrote the inflated number back to the DB.
    await seedPreference(testUserId, {
      metric_type: 'weight',
      unit: 'lbs',
    });
    const workout = await seedWorkout(testUserId, { name: 'Lbs Workout' });
    await seedWorkoutExercise(workout.id, {
      exercise_id: 'Barbell_Bench_Press_-_Medium_Grip',
      position: 0,
      sets: 1,
      reps: 10,
      weight_kg: null,
      rest_seconds: 0,
    });
    const schedule = await seedSchedule(testUserId, { is_active: true });
    await seedScheduleEntry(schedule.id, workout.id, {
      day_of_week: getTodayDayOfWeek(),
    });

    await page.goto('/workout-logs');
    await page.getByRole('button', { name: 'Lbs Workout' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Start' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Active Workout' })
    ).toBeVisible();

    // Field is labelled with the user's unit, so 'lbs' confirms the
    // preference was applied.
    const weightInput = page.getByPlaceholder('lbs');
    await expect(weightInput).toHaveCount(1);

    await weightInput.fill('100');
    // Click the Done checkbox to flush handleUpdateSet. With every set
    // completed the form auto-collapses the exercise (LogSetRow
    // unmounts), which is exactly the trigger we need to re-init local
    // state from the optimistic store.
    await page.getByRole('checkbox').click();
    await expect(page.getByPlaceholder('lbs')).toHaveCount(0);

    // Re-expand and assert the value round-tripped through optimistic
    // state correctly. Without the fix this read 220.5.
    await page.getByText('Barbell Bench Press - Medium Grip').click();
    await expect(page.getByPlaceholder('lbs')).toHaveValue('100');
    await expect(page.getByPlaceholder('Reps')).toHaveValue('10');
  });
});
