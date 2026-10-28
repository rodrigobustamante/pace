# PACE — Running Analytics App

> Context file for Claude Code. Read this entirely before touching any file.

## Reglas de colaboración

- **Nunca ejecutes `git commit` ni `git push`.** Cuando el trabajo esté listo para commitear, muestra el mensaje de commit sugerido en texto plano y espera a que el usuario lo ejecute manualmente.

## Project vision

Personal running analytics app that centralizes data from **Strava** (primary source, MVP), with architecture ready to incorporate Apple HealthKit in later phases. Generates training metrics, evolution charts, and AI-powered personalized coaching (Gemini).

Two surfaces:

- **Web app** (Next.js) — main dashboard, deep analysis
- **Mobile app** (React Native / Expo) — summaries, notifications, quick access

Target coaching style: **Runna** — training load analysis, form tracking, performance prediction, recovery advice, and adaptive plans.

---

## Tech stack

### Frontend web

- **Next.js 16** (App Router)
- **TypeScript** strict mode (`strict: true`)
- **Vanilla Extract** (`@vanilla-extract/css`, `@vanilla-extract/next-plugin`) — typed styles in `apps/web/styles/*.css.ts` (global theme, layout, components); `assignInlineVars` or inline `style` only for truly dynamic values (e.g. chart colors)
- **Recharts** for charts (already validated in prototype)
- **Zustand** for client-side global state
- **React Query (TanStack)** for data fetching and caching

### Backend

- **Next.js API Routes** (`/app/api/`) — REST endpoints
- **Prisma ORM** with **PostgreSQL** (Supabase in production, Docker locally)
- **Redis** for Strava response caching and rate limiting
- **BullMQ** for background sync jobs

### External integrations

- **Strava API v3** — OAuth 2.0, webhooks for real-time sync
- **Google Gemini API** (`gemini-2.5-flash`) — AI coaching (MVP). Architecture is provider-agnostic and easy to swap later.
- **Apple HealthKit** — planned for Phase 4 via React Native

### Mobile

- **Expo SDK 51** + **React Native**
- Shares TypeScript types with the web monorepo
- **Expo Notifications** for weekly push summaries

### Infrastructure

- **Vercel** for Next.js deployment
- **Supabase** for PostgreSQL + storage
- **Docker Compose** for local development (postgres + redis)

---

## Project architecture

```
pace/
├── apps/
│   ├── web/                    # Next.js 16 app
│   │   ├── app/
│   │   │   ├── (dashboard)/    # Route group: authenticated
│   │   │   │   ├── page.tsx    # Overview / main dashboard
│   │   │   │   ├── activities/ # Activity list and detail
│   │   │   │   ├── metrics/    # Evolution charts
│   │   │   │   └── coach/      # AI Coach — insights and weekly plan
│   │   │   ├── auth/           # Strava OAuth callback
│   │   │   └── api/
│   │   │       ├── strava/     # OAuth, webhook, sync
│   │   │       ├── activities/ # Normalized activity CRUD
│   │   │       ├── metrics/    # CTL/ATL/TSB calc, HR zones
│   │   │       └── coach/      # Gemini API calls
│   │   └── ...
│   └── mobile/                 # Expo app (Phase 4)
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared helpers (pace, HR, TSS)
│   └── db/                     # Prisma schema + shared client
├── CLAUDE.md                   # This file
├── SKILLS.md                   # Technical patterns and implementation guides
└── docker-compose.yml
```

---

## Development phases

Current phase: **Phase 3 — AI Coach (in progress)**. See [`ROADMAP.md`](./ROADMAP.md) for the full phase history and upcoming feature backlog.

---

## Data model (Prisma)

```prisma
model User {
  id                String         @id @default(cuid())
  stravaAthleteId   Int            @unique
  name              String
  email             String?
  profileImageUrl   String?
  maxHR             Int?           // For HR zone calculation
  restingHR         Int?
  accessToken       String         // Encrypted at rest
  refreshToken      String         // Encrypted at rest
  tokenExpiresAt    DateTime
  activities        Activity[]
  coachInsights     CoachInsight[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Activity {
  id            String    @id @default(cuid())
  stravaId      Int       @unique
  userId        String
  user          User      @relation(fields: [userId], references: [id])

  // Core
  name          String
  type          RunType   // easy | tempo | long | workout | race
  date          DateTime

  // Performance
  distanceM     Float     // meters — converted to km at presentation layer only
  durationSec   Int
  paceSeckm     Int       // seconds per km
  avgHRbpm      Int?
  maxHRbpm      Int?
  cadenceRpm    Int?
  elevationM    Float?
  caloriesKcal  Int?

  // Strava raw
  stravaData    Json      // full payload stored for future field access

  // Computed
  tss           Float?    // Training Stress Score
  feel          Int?      // 1–5 (simplified RPE)

  createdAt     DateTime  @default(now())
}

model CoachInsight {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // weekly | activity | alert
  refId     String?  // activity ID if applicable
  content   Json     // { title, body, type: warning|positive|tip|prediction }
  createdAt DateTime @default(now())
  expiresAt DateTime // cache invalidation marker
}

enum RunType {
  easy
  tempo
  long
  workout
  race
  unknown
}
```

---

## Key algorithms

### CTL / ATL / TSB (Athletic form model)

```
daily_TSS = sum of TSS from all activities on that day

CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) / 42   // Fitness, τ=42 days
ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) / 7    // Fatigue, τ=7 days
TSB_today = CTL_today - ATL_today                               // Form = Fitness - Fatigue
```

### Running TSS (HR-based, simplified Skiba)

```
TSS = (durationSec × avgHR × IF) / (thresholdHR × 3600) × 100

IF (Intensity Factor) = avgHR / thresholdHR
thresholdHR ≈ HR at 1h max effort (≈ 90% maxHR if no lactate test available)
```

### HR zones (5-zone model)

```
Z1: < 60% maxHR   (recovery)
Z2: 60–70%        (aerobic base)
Z3: 70–80%        (aerobic threshold)
Z4: 80–90%        (anaerobic threshold / tempo)
Z5: > 90%         (VO2max / neuromuscular)
```

### Race predictor (Riegel formula)

```
T2 = T1 × (D2 / D1)^1.06

T1 = known finish time at distance D1
T2 = predicted finish time at distance D2
```

---

## Strava integration

### Endpoints used

```
GET  /athlete                    → athlete profile
GET  /athlete/activities         → activity list (paginated, max 200/req)
GET  /activities/:id             → activity detail
GET  /activities/:id/streams     → per-second streams (HR, cadence, pace, latlon)
POST /push_subscriptions         → register real-time webhook
```

### OAuth flow

```
1. User → /api/strava/auth
2. Redirect → https://www.strava.com/oauth/authorize?client_id=...&scope=activity:read_all
3. Strava → /api/strava/callback?code=...
4. Exchange code → { access_token, refresh_token, expires_at, athlete }
5. Save tokens to DB, redirect → /dashboard
```

### Required scope

- `activity:read_all` — reads all activities including private ones

### Required environment variables

```env
# Strava
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=   # random string to validate incoming webhook calls

# Google Gemini
GEMINI_API_KEY=

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379

# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption (for Strava tokens stored in DB)
ENCRYPTION_KEY=    # 32-byte hex string
```

---

## AI Coach prompt guide

### Weekly summary prompt structure

The **system instruction** and surrounding code are in English.
The **prompt content and JSON output** stay in Spanish — they target the athlete-facing UI.

```
System:
You are an expert, personalized running coach in the style of Runna.
You analyze real athlete data and give concrete, personalized, actionable advice.
Avoid generalities. Be direct and specific.
The athlete is a serious recreational runner who trains with data and wants to improve consistently.
Always respond in Spanish.
Respond ONLY in valid JSON with this exact structure, no extra text:
{
  "summary": "string — 2-3 sentences on current status",
  "positive": { "title": "string", "body": "string" },
  "warning":  { "title": "string", "body": "string" },
  "tip":      { "title": "string", "body": "string" },
  "prediction":{ "title": "string", "body": "string" }
}

User:
Athlete: {name}
Max HR: {maxHR} bpm | Threshold HR: {thresholdHR} bpm

Current form:
- CTL (Fitness): {ctl} | ATL (Fatigue): {atl} | TSB (Form): {tsb}
- TSB trend: {improving|declining|stable}

This week ({weekStart} to {weekEnd}):
- Total km: {weeklyKm} | Sessions: {count} | TSS: {weeklyTSS}
- Avg pace: {avgPace} min/km | Avg HR: {avgHR} bpm
- Zone distribution: Z1:{z1min}min Z2:{z2min}min Z3:{z3min}min Z4:{z4min}min Z5:{z5min}min

Previous week: {prevWeekKm} km, TSS {prevWeekTSS} (volume change: {volumeChangePct}%)

Last 3 activities:
{recentActivities}

Generate the weekly analysis in JSON.
```

---

## Design and UX decisions

- **Styling**: Vanilla Extract — theme and utilities in `apps/web/styles/theme.css.ts` and per-route/per-component `*.css.ts` modules
- **Color palette**: background `#060d1a` (deep night blue), primary accent `#f97316` (orange), secondary accent `#4ade80` (green)
- **Typography**: Barlow Condensed (large numbers/headings) + DM Sans (body) + DM Mono (technical data)
- **Charts**: all dark theme, no heavy borders, custom tooltips with `#0f172a` background
- **Responsive**: **Mobile-first always.** Base styles target mobile (320–480px), override upward with `@media (min-width: Xpx)`. Breakpoints: `480px` (small tablet), `640px` (tablet/desktop). Use Vanilla Extract `"@media"` block inside `style()`. Never use `auto-fit` / `minmax` without explicit mobile fallback columns. Heatmaps and wide grids must have `overflowX: "auto"` on their wrapper. Drawer instead of sidebar on small screens.
- **Visual reference**: `running-dashboard.jsx` — use as the exact visual target for all UI work

---

## Code conventions

- All files in **strict TypeScript** — no exceptions
- Pure functions for metric calculations so they are testable in isolation
- Distances stored internally in **meters** — convert to km at the presentation layer only
- Durations stored internally in **seconds** — format at the presentation layer
- Pace stored in **sec/km** internally
- Clear layer separation: `lib/` for pure logic, `services/` for external I/O
- API routes validate all input with **Zod** before touching the DB
- Strava API errors handled with exponential backoff retry (max 3 attempts)

---

## What NOT to do

- No `any` in TypeScript — ever
- Never call the Strava API from the client — always proxy through own API routes
- Never store Strava tokens as plaintext — always encrypt with `ENCRYPTION_KEY`
- Never generate AI Coach insights on every request — cache with Redis TTL 24h
- Never calculate CTL/ATL/TSB on the client — server-side only
- Never use `useState` for server-fetched data — use React Query
