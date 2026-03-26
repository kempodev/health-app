import { test as setup, expect } from '@playwright/test';
import { getAdminClient } from './helpers/supabase-admin';
import path from 'path';

const authFile = path.resolve(__dirname, '.auth', 'user.json');

setup('authenticate test user', async ({ page }) => {
  const email = process.env.E2E_TEST_USER_EMAIL!;
  const password = process.env.E2E_TEST_USER_PASSWORD!;
  const admin = getAdminClient();

  // Create the test user if it doesn't exist
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find((u) => u.email === email);

  if (!existingUser) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
  } else {
    await admin.auth.admin.updateUser(existingUser.id, { password });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

  // Sign in via the REST API from Node.js
  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase sign-in failed: ${response.status} ${await response.text()}`
    );
  }

  const session = await response.json();

  // Build the cookie in the format @supabase/ssr expects.
  // By default (no cookieEncoding option), it stores raw JSON.
  // The chunker uses encodeURIComponent to measure size and chunks at 3180 chars.
  // If the encoded value fits in one chunk, it uses just the key name (no .0 suffix).
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionJson = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });

  // Check if we need to chunk (encodeURIComponent length > 3180)
  const encoded = encodeURIComponent(sessionJson);
  const chunkSize = 3180;

  const cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Lax';
    expires: number;
  }> = [];

  if (encoded.length <= chunkSize) {
    // Fits in one cookie — use the key name directly (no .0 suffix)
    cookies.push({
      name: cookieName,
      value: sessionJson,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 604800,
    });
  } else {
    // Need to chunk — split the encoded value, decode each chunk back
    let remaining = encoded;
    let index = 0;
    while (remaining.length > 0) {
      let chunkHead = remaining.slice(0, chunkSize);
      // Don't split in the middle of a percent-encoded sequence
      const lastPercent = chunkHead.lastIndexOf('%');
      if (lastPercent > chunkSize - 3) {
        chunkHead = chunkHead.slice(0, lastPercent);
      }
      cookies.push({
        name: `${cookieName}.${index}`,
        value: decodeURIComponent(chunkHead),
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 604800,
      });
      remaining = remaining.slice(chunkHead.length);
      index++;
    }
  }

  await page.context().addCookies(cookies);

  // Verify auth works by navigating to dashboard
  await page.goto('/dashboard');
  await expect(page.getByText('Welcome to the dashboard')).toBeVisible({
    timeout: 10000,
  });

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
