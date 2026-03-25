/**
 * Data migration script: Neon (Prisma) → Supabase
 *
 * Prerequisites:
 *   - Set DATABASE_URL to the Neon PostgreSQL connection string
 *   - Set SUPABASE_URL to the Supabase project URL
 *   - Set SUPABASE_SERVICE_ROLE_KEY to the Supabase service role key
 *
 * Usage:
 *   npx tsx scripts/migrate-data.ts
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

// Load .env and .env.local
config({ path: '.env' });
config({ path: '.env.local', override: true });

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing required env vars: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const neon = new Client({ connectionString: DATABASE_URL });

type OldUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

type OldMeasurement = {
  id: string;
  userId: string;
  metricType: string;
  metricValue: number;
  originalValue: number;
  originalUnit: string;
  createdAt: Date;
};

type OldPreference = {
  userId: string;
  metricType: string;
  unit: string;
};

type OldTarget = {
  userId: string;
  metricType: string;
  value: number;
  unit: string;
};

async function main() {
  await neon.connect();
  console.log('Connected to Neon database');

  // 1. Fetch all users from Neon
  const { rows: users } = await neon.query<OldUser>(
    'SELECT id, email, name, image FROM "User"',
  );
  console.log(`Found ${users.length} users to migrate`);

  // 2. Create Supabase Auth users and build ID mapping
  const idMap = new Map<string, string>(); // old CUID → new UUID

  for (const user of users) {
    if (!user.email) {
      console.warn(`Skipping user ${user.id} — no email`);
      continue;
    }

    // Check if user already exists in Supabase
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users.find((u) => u.email === user.email);

    if (existing) {
      console.log(
        `User ${user.email} already exists in Supabase (${existing.id})`,
      );
      idMap.set(user.id, existing.id);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      user_metadata: {
        full_name: user.name,
        avatar_url: user.image,
      },
    });

    if (error) {
      console.error(`Failed to create user ${user.email}:`, error.message);
      continue;
    }

    console.log(`Created user ${user.email} → ${data.user.id}`);
    idMap.set(user.id, data.user.id);
  }

  console.log(`\nMapped ${idMap.size} users`);

  // 3. Migrate measurements
  const { rows: measurements } = await neon.query<OldMeasurement>(
    'SELECT id, "userId", "metricType", "metricValue", "originalValue", "originalUnit", "createdAt" FROM "Measurement"',
  );
  console.log(`\nMigrating ${measurements.length} measurements...`);

  const measurementRows = measurements
    .filter((m) => idMap.has(m.userId))
    .map((m) => ({
      user_id: idMap.get(m.userId)!,
      metric_type: m.metricType,
      metric_value: m.metricValue,
      original_value: m.originalValue,
      original_unit: m.originalUnit,
      created_at: m.createdAt.toISOString(),
    }));

  if (measurementRows.length > 0) {
    // Insert in batches of 500
    for (let i = 0; i < measurementRows.length; i += 500) {
      const batch = measurementRows.slice(i, i + 500);
      const { error } = await supabase.from('measurements').insert(batch);
      if (error) {
        console.error(
          `Failed to insert measurements batch ${i}:`,
          error.message,
        );
      } else {
        console.log(`  Inserted measurements ${i + 1}–${i + batch.length}`);
      }
    }
  }

  // 4. Migrate user preferences
  const { rows: preferences } = await neon.query<OldPreference>(
    'SELECT "userId", "metricType", unit FROM "UserPreferences"',
  );
  console.log(`\nMigrating ${preferences.length} user preferences...`);

  const prefRows = preferences
    .filter((p) => idMap.has(p.userId))
    .map((p) => ({
      user_id: idMap.get(p.userId)!,
      metric_type: p.metricType,
      unit: p.unit,
    }));

  if (prefRows.length > 0) {
    const { error } = await supabase.from('user_preferences').insert(prefRows);
    if (error) {
      console.error('Failed to insert preferences:', error.message);
    } else {
      console.log(`  Inserted ${prefRows.length} preferences`);
    }
  }

  // 5. Migrate measurement targets
  const { rows: targets } = await neon.query<OldTarget>(
    'SELECT "userId", "metricType", value, unit FROM "MeasurementTarget"',
  );
  console.log(`\nMigrating ${targets.length} measurement targets...`);

  const targetRows = targets
    .filter((t) => idMap.has(t.userId))
    .map((t) => ({
      user_id: idMap.get(t.userId)!,
      metric_type: t.metricType,
      value: t.value,
      unit: t.unit,
    }));

  if (targetRows.length > 0) {
    const { error } = await supabase
      .from('measurement_targets')
      .insert(targetRows);
    if (error) {
      console.error('Failed to insert targets:', error.message);
    } else {
      console.log(`  Inserted ${targetRows.length} targets`);
    }
  }

  await neon.end();
  console.log('\nMigration complete!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

