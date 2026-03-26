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

### Database Schema

Tables in Supabase `public` schema with RLS enabled. All reference `auth.users(id)`.

| Table                 | Purpose                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `measurements`        | Health data points (metric_type, metric_value, original_value, original_unit, created_at) |
| `user_preferences`    | Preferred units per metric_type. Unique on (user_id, metric_type)                         |
| `measurement_targets` | Goal values per metric_type. Unique on (user_id, metric_type)                             |

**Enums (PostgreSQL):**

- `metric_type`: `weight`, `body_fat`, `chest`, `arm`, `waist`, `hip`, `thigh`, `calf`
- `unit_type`: `kg`, `lbs`, `percentage`, `cm`, `inches`

**TypeScript types:** Defined in [src/app/types.ts](src/app/types.ts) — `MetricType`, `UnitType`, `Measurement`, `MeasurementTarget`, `UserPreference`, `ActionResult`

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
