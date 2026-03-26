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

export async function cleanupTestData(userId: string) {
  const client = getAdminClient();
  await client.from('measurements').delete().eq('user_id', userId);
  await client.from('measurement_targets').delete().eq('user_id', userId);
  await client.from('user_preferences').delete().eq('user_id', userId);
}
