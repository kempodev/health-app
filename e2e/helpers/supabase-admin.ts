import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — ensure .env.test is configured'
      );
    }
    _client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export async function getTestUserId(): Promise<string> {
  const email = process.env.E2E_TEST_USER_EMAIL!;
  const { data } = await getAdminClient().auth.admin.listUsers();
  const user = data?.users.find((u) => u.email === email);
  if (!user) throw new Error(`Test user ${email} not found`);
  return user.id;
}

export async function seedMeasurement(
  userId: string,
  overrides: {
    metric_type?: string;
    metric_value?: number;
    original_value?: number;
    original_unit?: string;
    created_at?: string;
  } = {}
) {
  const { data, error } = await getAdminClient()
    .from('measurements')
    .insert({
      user_id: userId,
      metric_type: overrides.metric_type ?? 'weight',
      metric_value: overrides.metric_value ?? 80,
      original_value: overrides.original_value ?? 80,
      original_unit: overrides.original_unit ?? 'kg',
      created_at: overrides.created_at ?? new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function seedTarget(
  userId: string,
  overrides: {
    metric_type?: string;
    value?: number;
    unit?: string;
  } = {}
) {
  const { data, error } = await getAdminClient()
    .from('measurement_targets')
    .upsert(
      {
        user_id: userId,
        metric_type: overrides.metric_type ?? 'weight',
        value: overrides.value ?? 75,
        unit: overrides.unit ?? 'kg',
      },
      { onConflict: 'user_id,metric_type' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function seedPreference(
  userId: string,
  overrides: {
    metric_type?: string;
    unit?: string;
  } = {}
) {
  const { data, error } = await getAdminClient()
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        metric_type: overrides.metric_type ?? 'weight',
        unit: overrides.unit ?? 'kg',
      },
      { onConflict: 'user_id,metric_type' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function seedWorkout(
  userId: string,
  overrides: {
    name?: string;
    description?: string;
  } = {}
) {
  const { data, error } = await getAdminClient()
    .from('workouts')
    .insert({
      user_id: userId,
      name: overrides.name ?? 'Test Workout',
      description: overrides.description ?? '',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function seedWorkoutExercise(
  workoutId: string,
  overrides: {
    exercise_id?: string;
    position?: number;
    sets?: number;
    reps?: number;
    weight_kg?: number | null;
    rest_seconds?: number;
  } = {}
) {
  const { data, error } = await getAdminClient()
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      exercise_id: overrides.exercise_id ?? 'Barbell_Bench_Press_-_Medium_Grip',
      position: overrides.position ?? 0,
      sets: overrides.sets ?? 3,
      reps: overrides.reps ?? 10,
      weight_kg: overrides.weight_kg ?? 60,
      rest_seconds: overrides.rest_seconds ?? 60,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function seedSchedule(
  userId: string,
  overrides: {
    name?: string;
    is_active?: boolean;
  } = {}
) {
  const { data, error } = await getAdminClient()
    .from('weekly_schedules')
    .insert({
      user_id: userId,
      name: overrides.name ?? 'Test Schedule',
      is_active: overrides.is_active ?? false,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function seedScheduleEntry(
  scheduleId: string,
  workoutId: string,
  overrides: {
    day_of_week?: number;
  } = {}
) {
  const { data, error } = await getAdminClient()
    .from('schedule_entries')
    .insert({
      schedule_id: scheduleId,
      workout_id: workoutId,
      day_of_week: overrides.day_of_week ?? 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function cleanupTestData(userId: string) {
  const client = getAdminClient();
  // Gym features (cascade handles children, but delete in order for safety)
  await client.from('workout_logs').delete().eq('user_id', userId);
  await client.from('weekly_schedules').delete().eq('user_id', userId);
  await client.from('workouts').delete().eq('user_id', userId);
  // Original tables
  await client.from('measurements').delete().eq('user_id', userId);
  await client.from('measurement_targets').delete().eq('user_id', userId);
  await client.from('user_preferences').delete().eq('user_id', userId);
}
