# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start development server
npm run build          # Production build
npm run lint           # ESLint on src/
npm run test:e2e       # Run Playwright E2E tests (headless)
npm run test:e2e:ui    # Run E2E tests with Playwright UI
npm run test:e2e:headed # Run E2E tests in headed browser
```

E2E tests live in `e2e/` and use Playwright. They require a `.env.test` file with `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, and `E2E_TEST_USER_PASSWORD` in addition to the standard Supabase env vars.

## Architecture

**Primary usage:** Mobile browser. Design all UI mobile-first — prioritize touch targets, vertical layouts, and compact views. Test responsiveness at small viewports before larger ones.

**Stack:** Next.js 15 App Router · TypeScript (strict) · Supabase (PostgreSQL + Auth) · Tailwind CSS v4 + Radix UI (Shadcn components) · Recharts

### Key Design Decisions

- **Server-first:** Uses Server Components and Server Actions throughout. Client components are used only where interactivity is required (forms, charts).
- **Unit storage vs. display:** Measurements are stored in base units (kg, cm, %) in the DB. Conversion to user-preferred units (lbs, inches) happens at the display layer via utilities in [src/lib/utils.ts](src/lib/utils.ts).
- **User scoping:** Row Level Security (RLS) policies in Supabase enforce that users can only access their own data. Auth is handled by Supabase Auth with GitHub/Google OAuth.
- **Path alias:** `@/*` maps to `src/*`.

### Data Flow

```
User → OAuth (GitHub/Google) → Supabase Auth → Supabase PostgreSQL
                                                       ↕
Server Actions (src/app/*/actions.ts) ← Server Components
```

- **Supabase clients:** [src/lib/supabase/server.ts](src/lib/supabase/server.ts) (server-side), [src/lib/supabase/client.ts](src/lib/supabase/client.ts) (browser-side)
- **Middleware:** [src/middleware.ts](src/middleware.ts) refreshes Supabase Auth sessions on every request
- **Auth callback:** [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts) handles OAuth code exchange
- **Login page:** [src/app/auth/login/page.tsx](src/app/auth/login/page.tsx) with GitHub/Google buttons
- **Measurements:** [src/app/measurements/actions.ts](src/app/measurements/actions.ts) — add, get, delete measurements
- **Profile/Preferences:** [src/app/profile/actions.ts](src/app/profile/actions.ts) and [src/lib/actions.ts](src/lib/actions.ts) — user unit preferences and targets per metric
- **Dashboard:** [src/app/dashboard/](src/app/dashboard/) — shows latest values for weight, waist, body_fat
- **Workouts:** [src/app/workouts/actions.ts](src/app/workouts/actions.ts) — CRUD workout templates, add/remove/reorder exercises, duplicate workouts
- **Schedules:** [src/app/schedules/actions.ts](src/app/schedules/actions.ts) — CRUD weekly schedules, assign workouts to days, set active schedule
- **Workout Logs:** [src/app/workout-logs/actions.ts](src/app/workout-logs/actions.ts) — start/complete workout sessions, log sets/reps/weights
- **Exercise data:** [src/lib/exercises.ts](src/lib/exercises.ts) — loads static exercise data from `exercises.json` (873 exercises), search/filter utilities

### Database Schema

Tables in Supabase `public` schema with RLS enabled. All reference `auth.users(id)`.

| Table                 | Purpose                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `measurements`          | Health data points (metric_type, metric_value, original_value, original_unit, created_at) |
| `user_preferences`      | Preferred units per metric_type. Unique on (user_id, metric_type)                         |
| `measurement_targets`   | Goal values per metric_type. Unique on (user_id, metric_type)                             |
| `workouts`              | Reusable workout templates (name, description). Duplicate for variations                  |
| `workout_exercises`     | Exercises within a workout template (exercise_id, position, sets, reps, weight_kg, rest)  |
| `weekly_schedules`      | Named weekly schedules with is_active flag. Partial unique index on active                |
| `schedule_entries`      | Workout-to-day assignments. UNIQUE(schedule_id, workout_id, day_of_week)                  |
| `workout_logs`          | Completed/in-progress workout sessions. Snapshots workout name                            |
| `workout_log_exercises` | Individual sets performed (exercise_id, set_number, reps, weight_kg, completed)           |

**Enums (PostgreSQL):**

- `metric_type`: `weight`, `body_fat`, `chest`, `arm`, `waist`, `hip`, `thigh`, `calf`
- `unit_type`: `kg`, `lbs`, `percentage`, `cm`, `inches`

**TypeScript types:** Defined in [src/app/types.ts](src/app/types.ts) — `MetricType`, `UnitType`, `Measurement`, `MeasurementTarget`, `UserPreference`, `ActionResult`, `Exercise`, `MuscleGroup`, `DayOfWeek`

Feature-specific types in: [src/app/workouts/types.ts](src/app/workouts/types.ts), [src/app/schedules/types.ts](src/app/schedules/types.ts), [src/app/workout-logs/types.ts](src/app/workout-logs/types.ts)

**Exercise images:** Prefixed with `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/` — configured in `next.config.ts` remotePatterns. Exercise weights stored in kg (base unit), converted using same utilities as measurements.

### Shared UI Components

Shadcn UI components live in [src/components/ui/](src/components/ui/). The `components.json` file configures Shadcn. Add new Shadcn components via `npx shadcn@latest add <component>`.

## Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase anon/public key

OAuth provider credentials (GitHub, Google) are configured in the Supabase Dashboard, not as app env vars.

## Additional Guidelines

- Always update tests when changing features. Add tests when adding new features.
- Keep CLAUDE.md up-to-date on any relevant changes to the codebase.
- Ask additional questions when planning designs and features.
- Make frequent git commits when changing or adding any features. Make sure tests pass before committing.
