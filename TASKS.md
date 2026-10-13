# TASKS.md — Executable backlog for Claude Code

> Tasks ordered by priority. Each task is atomic and independently testable.
> Status: [ ] pending | [x] done | [~] in progress | [!] blocked

---

## SPRINT 1 — Project setup and skeleton

### S1-01: Initialize Turborepo monorepo

```bash
pnpm dlx create-turbo@latest pace --package-manager pnpm
cd pace
```

Result: `apps/` and `packages/` folder structure created.

### S1-02: Create Next.js app

```bash
cd apps
pnpm create next-app@latest web \
  --typescript --tailwind --eslint \
  --app --src-dir=false --import-alias="@/*"
```

### S1-03: Create shared packages

```
packages/
  types/   → package.json with name "@pace/types"
  utils/   → package.json with name "@pace/utils"
  db/      → package.json with name "@pace/db"
```

Each needs a `tsconfig.json` extending the root config.

### S1-04: Docker Compose

Create `docker-compose.yml` as shown in SKILLS.md §9.

```bash
docker-compose up -d
# Verify: docker ps shows postgres:5432 and redis:6379 running
```

### S1-05: Prisma setup

```bash
cd packages/db
pnpm add prisma @prisma/client
npx prisma init
```

Write `schema.prisma` from the data model in CLAUDE.md.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### S1-06: Environment variables

Create `.env.example` with all keys listed in CLAUDE.md § "Required environment variables".
Create `.env.local` with real values:

- `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` → from strava.com/settings/api
- `ENCRYPTION_KEY` → `openssl rand -hex 32`
- `NEXTAUTH_SECRET` → `openssl rand -base64 32`
- `DATABASE_URL` → `postgresql://pace:pace_local_pw@localhost:5432/pace_dev`
- `REDIS_URL` → `redis://localhost:6379`

---

## SPRINT 2 — Strava OAuth

### S2-01: Install dependencies

```bash
cd apps/web
pnpm add @google/generative-ai ioredis
pnpm add -D @types/node
```

### S2-02: Implement encryption

Create `apps/web/lib/crypto.ts` as shown in SKILLS.md §8.
Verify: `decrypt(encrypt(x)) === x`.

### S2-03: Redis client

Create `apps/web/lib/redis.ts`:

```typescript
import Redis from "ioredis";
export const redis = new Redis(process.env.REDIS_URL!);
```

### S2-04: Auth helper (extract userId from session cookie)

Create `apps/web/lib/auth.ts`:

```typescript
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const userId = cookies().get("pace_user_id")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
```

### S2-05: API route — Strava auth redirect

Create `apps/web/app/api/strava/auth/route.ts` as shown in SKILLS.md §1.

### S2-06: API route — Strava callback

Create `apps/web/app/api/strava/callback/route.ts` as shown in SKILLS.md §1.
Important: calls `syncActivities` in the background (fire and forget).

### S2-07: Strava client with auto-refresh

Create `apps/web/lib/strava/client.ts` as shown in SKILLS.md §2.

### S2-08: Test OAuth flow end-to-end

```bash
# Start ngrok, update NEXT_PUBLIC_APP_URL
npx ngrok http 3000
# Navigate to localhost:3000/api/strava/auth
```

Checklist:

- [ ] User record created in `User` table
- [ ] `access_token` and `refresh_token` are encrypted (not plaintext)
- [ ] `pace_user_id` cookie is set in browser
- [ ] Redirect to `/dashboard` works

---

## SPRINT 3 — Activity sync

### S3-01: Activity normalizer

Create `apps/web/services/strava/normalize.ts` as shown in SKILLS.md §3.

### S3-02: Sync service

Create `apps/web/services/strava/sync.ts` as shown in SKILLS.md §3.
Include both `syncActivities` (paginated pull) and `syncSingleActivity` (webhook handler).

### S3-03: Webhook endpoint

Create `apps/web/app/api/strava/webhook/route.ts` as shown in SKILLS.md §7.

### S3-04: Register webhook with Strava

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID \
  -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=https://YOUR_NGROK.ngrok.io/api/strava/webhook \
  -F verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN
```

Expected response: `{"id": 12345}` — save the subscription ID.

### S3-05: API route — List activities

Create `apps/web/app/api/activities/route.ts`:

```typescript
// GET /api/activities?page=1&limit=20
// Returns paginated activities for the authenticated user
```

### S3-06: Verify full sync

```bash
psql postgresql://pace:pace_local_pw@localhost:5432/pace_dev
SELECT COUNT(*), type FROM "Activity" GROUP BY type;
# Should show the athlete's real runs
```

---

## SPRINT 4 — Metrics

### S4-01: Formatting helpers

Create `packages/utils/src/format.ts` as shown in SKILLS.md §6.

### S4-02: CTL/ATL/TSB calculation

Create `packages/utils/src/fitness.ts` as shown in SKILLS.md §4.
Exports: `calculateFitness`, `calculateRunTSS`, `estimateThresholdHR`.

### S4-03: HR zones per activity

Create `packages/utils/src/zones.ts`:

- `hrZone(hr, maxHR)` → 1–5
- `zoneDistribution(activities)` → minutes per zone

### S4-04: Race predictor

Create `packages/utils/src/predictor.ts`:

- `predictRaceTime(knownTimeSec, knownDistM, targetDistM)`
- Export predictions for 5K, 10K, 21K, 42K

### S4-05: API route — Metrics

Create `apps/web/app/api/metrics/route.ts`:

```typescript
// GET /api/metrics
// Returns: { fitness: FitnessPoint[], weeklyData: WeeklyStats[], zones: ZoneStats }
```

### S4-06: API route — Race predictions

Create `apps/web/app/api/metrics/predictions/route.ts`.

---

## SPRINT 5 — UI with real data

### S5-01: Install UI dependencies

```bash
cd apps/web
pnpm add recharts zustand @tanstack/react-query
```

### S5-02: Port prototype to Next.js

Use `running-dashboard.jsx` as the exact visual reference.
Create components in `apps/web/components/`:

- `StatCard.tsx`
- `charts/VolumeChart.tsx`
- `charts/FitnessChart.tsx`
- `charts/HRZonesChart.tsx`
- `charts/RadarChart.tsx`
- `ActivityRow.tsx`
- `CoachInsightCard.tsx`
- `WeekPlanGrid.tsx`

### S5-03: Pages with real data

Create pages in `apps/web/app/(dashboard)/`:

- `page.tsx` → Overview (KPIs + charts)
- `activities/page.tsx` → Paginated list
- `metrics/page.tsx` → Evolution charts
- `coach/page.tsx` → AI insights + weekly plan

### S5-04: Layout with navigation

Create `apps/web/app/(dashboard)/layout.tsx` with:

- Header with tabs (Overview, Activities, Metrics, AI Coach)
- Sync status indicator
- Strava athlete avatar

### S5-05: Loading and error states

- Skeleton loaders for each section
- Error boundaries with useful messages
- Toast for sync errors

---

## SPRINT 6 — AI Coach

### S6-01: Context builder

Create `apps/web/services/coach/context.ts`:

```typescript
// buildWeeklyContext(userId): WeeklyContext
// Aggregates metrics, recent activities, and trends into a single object
```

### S6-02: API route — Weekly coach (streaming)

Create `apps/web/app/api/coach/weekly/route.ts` as shown in SKILLS.md §5.
Uses `@google/generative-ai` with model `gemini-2.5-flash`.
`responseMimeType: 'application/json'` — no need to parse markdown fences.

### S6-03: API route — Individual activity analysis

Create `apps/web/app/api/coach/activity/[id]/route.ts`:

- Analyzes a single activity with Gemini
- Gives feedback on pace consistency, HR, cadence, and effort level

### S6-04: Streaming hook

Create `apps/web/hooks/useCoachStream.ts`:

```typescript
// Consumes SSE from /api/coach/weekly
// Returns { insights, isLoading, error }
```

### S6-05: AI Coach UI

Update `apps/web/app/(dashboard)/coach/page.tsx`:

- Weekly summary with streaming text (typewriter effect)
- Insight cards with staggered entrance animation
- Weekly plan generated by Gemini
- "Regenerate" button that invalidates the Redis cache

---

## FUTURE BACKLOG (post-MVP)

### B-01: Athlete profile

- Form to input max HR, resting HR, and race goal
- These values significantly improve CTL/ATL/TSB accuracy

### B-02: Time range selector

- Filter charts by: last week, month, 3 months, 6 months, year
- URL params so views can be bookmarked and shared

### B-03: Activity comparison

- Select 2 runs and compare metrics side by side

### B-04: Weekly email digest

- Summary email via Resend API
- Optionally: push notifications via Expo (mobile phase)

### B-05: Expo mobile app

- Expo SDK 51 setup
- Port of the 4 main screens
- HealthKit integration (HRV, sleep, VO2Max from Apple)

### B-06: Strava segments

- Import PR history for popular segments
- Evolution chart per segment over time

---

## Pre-deploy checklist (Vercel)

- [ ] All env vars configured in Vercel dashboard
- [ ] `DATABASE_URL` points to Supabase (not localhost)
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] Strava webhook updated to production URL
- [ ] `ENCRYPTION_KEY` generated and stored securely outside the repo
- [ ] Prisma migrations applied to production DB: `npx prisma migrate deploy`
- [ ] Redis points to Upstash (not localhost)
- [ ] `NODE_ENV=production` set
