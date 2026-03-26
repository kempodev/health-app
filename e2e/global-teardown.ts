import { test as teardown } from '@playwright/test';
import { getAdminClient, cleanupTestData } from './helpers/supabase-admin';

teardown('cleanup test user data', async () => {
  const email = process.env.E2E_TEST_USER_EMAIL!;
  const admin = getAdminClient();

  const { data } = await admin.auth.admin.listUsers();
  const user = data?.users.find((u) => u.email === email);

  if (user) {
    await cleanupTestData(user.id);
    await admin.auth.admin.deleteUser(user.id);
  }
});
