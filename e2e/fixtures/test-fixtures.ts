import { test as base } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Fixtures = {
  adminSupabase: SupabaseClient;
  testUserId: string;
};

export const test = base.extend<Fixtures>({
  adminSupabase: async ({}, use) => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await use(client);
  },

  testUserId: async ({ adminSupabase }, use) => {
    const email = process.env.E2E_TEST_USER_EMAIL!;
    const { data } = await adminSupabase.auth.admin.listUsers();
    const user = data?.users.find((u) => u.email === email);
    if (!user) throw new Error(`Test user ${email} not found`);
    await use(user.id);
  },
});

export { expect } from '@playwright/test';
