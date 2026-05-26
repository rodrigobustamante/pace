# PACE — Personal Running Analytics

> Training analytics platform that centralizes Strava data, computes performance metrics, and delivers personalized AI coaching — available on web and iOS.

---

## Features

- **Strava sync** — OAuth 2.0, full-history initial pull, and real-time webhook ingestion
- **Training form metrics** — CTL, ATL, and TSB (Banister/Coggan model) computed across full history
- **Heart rate zone distribution** — 5-zone model based on athlete max HR; auto-calculated effort level (feel) from HR at sync time
- **Race predictor** — Riegel formula projections for 5K, 10K, 21K, and 42K
- **Weekly AI coach** — Personalized weekly analysis with Redis caching until Monday (SSE streaming)
- **Daily recommendation** — Train vs rest, with session type, duration, and intensity adjusted to current fatigue
- **AI chat** — Conversational coach with full athlete context and persistent conversation history
- **Training plan** — Goal-based day-by-day plan (including strength days); per-day willTrain toggle; adaptive plan on missed sessions
- **Multiple race milestones** — A/B/C priority, location, countdown; each gets its own Gemini-generated plan
- **Overtraining risk signals** — Algorithmic detection of high ATL, consecutive days, and TSB trends
- **Multi-model AI** — Switch between Gemini, GPT-4o, and Claude from settings; preference persisted per user
- **Per-activity analysis** — Feedback on effort, execution, recovery, and improvement opportunities
- **Background sync** — 1-hour auto-sync via polling; webhook remains primary real-time channel
- **iOS mobile app** — Native Expo app with the same 4 core screens, deep-link Strava OAuth, and weekly push notifications

---

## Stack

### Web

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 14 (App Router)                               |
| Language      | TypeScript (strict)                                   |
| Styling       | Vanilla Extract (`@vanilla-extract/css`)              |
| Charts        | Recharts                                              |
| Client state  | Zustand + TanStack React Query                        |
| ORM           | Prisma 5                                              |
| Database      | PostgreSQL 16 (local Docker / Supabase in production) |
| Cache         | Redis 7 (local Docker / Upstash in production)        |
| AI            | Vercel AI SDK — Gemini 2.5 Flash / GPT-4o / Claude    |
| Monorepo      | Turborepo + pnpm workspaces                           |
| Deployment    | Vercel                                                |

### Mobile

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Framework     | Expo SDK 55 + React Native 0.83                       |
| Navigation    | Expo Router v4 (file-based)                           |
| Language      | TypeScript (strict)                                   |
| Charts        | react-native-gifted-charts (SVG)                      |
| Client state  | Zustand + TanStack React Query                        |
| Auth          | JWT (jose HS256) stored in SecureStore                |
| Push          | Expo Notifications → Expo Push API                    |
| Deployment    | EAS Build (iOS)                                       |

---

## Monorepo architecture

```
pace/
├── apps/
│   ├── web/                        # Next.js 14 app
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── strava/         # OAuth, callback, webhook, manual sync
│   │   │   │   ├── activities/     # Paginated activity CRUD + single-activity
│   │   │   │   ├── metrics/        # CTL/ATL/TSB, zones, predictions, records, heatmap
│   │   │   │   ├── coach/          # Weekly (SSE), daily, activity, chat, risk
│   │   │   │   ├── goals/          # Milestones CRUD + training plan generation
│   │   │   │   ├── auth/           # Logout + mobile session/refresh endpoints
│   │   │   │   ├── user/           # Settings, profile, push token
│   │   │   │   └── notifications/  # Weekly Vercel Cron push notifications
│   │   │   ├── (dashboard)/        # Overview, Activities, Metrics, AI Coach, Plan
│   │   │   └── auth/               # OAuth error page
│   │   ├── components/             # UI components and charts
│   │   ├── hooks/                  # useCoachStream
│   │   ├── lib/                    # crypto, redis, db, auth, jwt, milestones
│   │   └── services/
│   │       ├── strava/             # normalize, sync
│   │       ├── ai/                 # provider registry (Gemini/OpenAI/Anthropic)
│   │       ├── coach/              # context builders (weekly, daily, activity)
│   │       └── goals/              # training plan generation
│   └── mobile/                     # Expo SDK 55 iOS app
│       ├── app/
│       │   ├── _layout.tsx         # Root: QueryClient, auth boot, push token
│       │   ├── auth/               # Login screen + deep-link callback
│       │   └── (tabs)/             # Home, Activities, Metrics, Coach + chat
│       ├── components/             # ActivityRow, DailyCoachCard, RiskCard, charts/, ui/
│       ├── hooks/                  # useMetrics, useCoachDaily, useRisk, useActivities, etc.
│       ├── lib/                    # constants, auth (SecureStore), apiFetch client
│       └── store/                  # Zustand auth store
├── packages/
│   ├── db/                         # Prisma schema + singleton client
│   ├── types/                      # Shared TypeScript types
│   └── utils/                      # format, fitness, zones, predictor
├── docker-compose.yml
└── turbo.json
```

---

## Data model

```prisma
User          # Athlete with encrypted Strava tokens (AES-256-GCM),
              # preferredModel, expoPushToken
Activity      # Normalized run: distance, pace, HR, TSS, type, feel (1–5)
CoachInsight  # Gemini responses cached by week/activity
CoachChat     # Persistent chat messages (userId, conversationId, role, content)
Goal          # Race milestone: goalType, targetDate, location, priority (A/B/C)
TrainingPlan  # Gemini-generated plan linked to a goal (one-to-one)
TrainingDay   # Individual day: workoutType, durationMin, targetPace/Zone, willTrain
```

**Enums**
- `RunType`: `easy | tempo | long | workout | race | strength | unknown`
- `GoalType`: `race_5k | race_10k | half_marathon | marathon | custom`

`stravaId` is stored as `BigInt` — modern Strava IDs exceed the `INT4` range.

---

## Core algorithms

**CTL / ATL / TSB** (training form model):

```
CTL_today = CTL_yesterday + (TSS_today − CTL_yesterday) / 42   # Fitness, τ=42 days
ATL_today = ATL_yesterday + (TSS_today − ATL_yesterday) / 7    # Fatigue, τ=7 days
TSB_today = CTL_today − ATL_today                               # Form = Fitness − Fatigue
```

**HR-based TSS** (simplified Skiba method):

```
IF  = avgHR / thresholdHR
TSS = (durationSec × avgHR × IF) / (thresholdHR × 3600) × 100
```

**Race predictor** (Riegel formula):

```
T2 = T1 × (D2 / D1)^1.06
```

**Auto-calculated feel** (HR-zone → RPE mapping):

```
Z1 (< 60% maxHR)  → 1 · Very easy
Z2 (60–70%)       → 2 · Easy
Z3 (70–80%)       → 3 · Moderate
Z4 (80–90%)       → 4 · Hard
Z5 (> 90%)        → 5 · Maximum
```

**Formula sources and references:**

- **CTL / ATL / TSB** — Banister et al. (1975); Morton et al. [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1974899/)
- **TSS / IF** — Coggan & Allen; Busso (2003) [PubMed](https://pubmed.ncbi.nlm.nih.gov/12840641/)
- **Riegel** — Riegel, P. S. (1981) [PubMed](https://pubmed.ncbi.nlm.nih.gov/7235349/)

---

## API Routes

### Strava

| Method     | Route                      | Description                               |
| ---------- | -------------------------- | ----------------------------------------- |
| `GET`      | `/api/strava/auth`         | Starts the Strava OAuth flow              |
| `GET`      | `/api/strava/callback`     | OAuth callback, user upsert, initial sync |
| `GET/POST` | `/api/strava/webhook`      | Strava verification and event ingestion   |
| `GET/POST` | `/api/strava/sync`         | Check sync status / force manual re-sync  |

### Activities

| Method | Route                    | Description                            |
| ------ | ------------------------ | -------------------------------------- |
| `GET`  | `/api/activities`        | Paginated list (`?page=1&limit=20`)    |
| `GET`  | `/api/activities/:id`    | Single activity detail                 |

### Metrics

| Method | Route                         | Description                          |
| ------ | ----------------------------- | ------------------------------------ |
| `GET`  | `/api/metrics`                | CTL/ATL/TSB, weekly data, HR zones   |
| `GET`  | `/api/metrics/predictions`    | Race predictions (Riegel)            |
| `GET`  | `/api/metrics/records`        | Personal records (5K/10K/21K/42K)    |
| `GET`  | `/api/metrics/heatmap`        | Weekly km heatmap data               |

### AI Coach

| Method | Route                         | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| `GET`  | `/api/coach/weekly`           | Weekly analysis — SSE streaming, cache until Mon  |
| `GET`  | `/api/coach/daily`            | Daily train/rest recommendation, cache until midnight |
| `GET`  | `/api/coach/risk`             | Overtraining risk signals + race-day projection   |
| `POST` | `/api/coach/chat`             | Streaming AI chat (plain-text chunks)             |
| `GET`  | `/api/coach/conversations`    | List past conversations with preview              |
| `GET`  | `/api/coach/activity/:id`     | Per-activity analysis (24h cache)                 |

### Goals & Training Plan

| Method   | Route                                  | Description                                        |
| -------- | -------------------------------------- | -------------------------------------------------- |
| `GET`    | `/api/goals`                           | All active milestones sorted by date               |
| `POST`   | `/api/goals`                           | Create milestone + generate Gemini training plan   |
| `PATCH`  | `/api/goals/:id`                       | Update title / location / priority                 |
| `DELETE` | `/api/goals/:id`                       | Soft-delete milestone (`isActive = false`)         |
| `POST`   | `/api/goals/:id/regenerate`            | Regenerate training plan for a milestone           |
| `POST`   | `/api/goals/:id/check-missed`          | Detect + mark missed training days (debounced 23h) |
| `PATCH`  | `/api/goals/:id/plan/days/:date`       | Toggle `willTrain` for a training day              |

### Auth

| Method | Route                          | Description                                         |
| ------ | ------------------------------ | --------------------------------------------------- |
| `POST` | `/api/auth/logout`             | Clear session cookie                                |
| `POST` | `/api/auth/mobile/session`     | Exchange one-time sessionCode → JWT + refreshToken  |
| `POST` | `/api/auth/mobile/refresh`     | Rotate JWT pair (refresh token rotation)            |

### User

| Method  | Route                   | Description                              |
| ------- | ----------------------- | ---------------------------------------- |
| `GET`   | `/api/user/me`          | Profile (`id`, `name`, `profileImageUrl`) |
| `GET/PATCH` | `/api/user/settings` | Read / update maxHR, preferredModel, etc |
| `POST`  | `/api/user/push-token`  | Register Expo push token                 |

### Notifications

| Method | Route                          | Description                                      |
| ------ | ------------------------------ | ------------------------------------------------ |
| `POST` | `/api/notifications/weekly`    | Vercel Cron (Mon 08:00 UTC) — weekly push summary |

---

## Security

- Strava tokens encrypted at rest with AES-256-GCM before DB storage
- Web: cookie-based session (`httpOnly`, `sameSite: lax`)
- Mobile: JWT (HS256 via `jose`) stored in SecureStore; Bearer token on every request
- One-time `sessionCode` flow for mobile OAuth — raw `userId` never sent over deep link
- Refresh token rotation with Redis revocation support
- Strava tokens auto-refresh when expiring in less than 10 minutes
- No direct Strava API calls from the client — always proxied through API routes
- API route inputs validated with Zod

---

## Project phases

| Phase   | Status      | Description                                                                       |
| ------- | ----------- | --------------------------------------------------------------------------------- |
| **0**   | ✅ Done     | Visual prototype with mock data (React + Recharts)                                |
| **1**   | ✅ Done     | Monorepo setup, Strava OAuth, activity sync                                       |
| **2**   | ✅ Done     | CTL/ATL/TSB, HR zones, race predictor, metrics API                                |
| **3**   | ✅ Done     | AI coach: weekly (SSE), daily, chat, per-activity, training plan                  |
| **3.5** | ✅ Done     | Race milestones, strength days, auto-feel, adaptive plan, multi-model AI, chat history |
| **4**   | ✅ Done     | Expo iOS app: auth, overview, activities, metrics, coach chat, push notifications |

---

## Local setup

### Requirements

- Node.js 20+
- pnpm 9+
- Docker Desktop

### 1. Clone and install

```bash
git clone <repo>
cd pace
pnpm install
```

### 2. Environment variables

```bash
cp .env.example apps/web/.env.local
```

Update `apps/web/.env.local` with real values:

| Variable                      | Where to get it                                              |
| ----------------------------- | ------------------------------------------------------------ |
| `STRAVA_CLIENT_ID`            | strava.com/settings/api                                      |
| `STRAVA_CLIENT_SECRET`        | strava.com/settings/api                                      |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | `openssl rand -hex 16`                                       |
| `GEMINI_API_KEY`              | aistudio.google.com/app/apikey                               |
| `OPENAI_API_KEY`              | platform.openai.com *(optional)*                             |
| `ANTHROPIC_API_KEY`           | console.anthropic.com *(optional)*                           |
| `ENCRYPTION_KEY`              | `openssl rand -hex 32`                                       |
| `JWT_SECRET`                  | `openssl rand -hex 32`                                       |
| `CRON_SECRET`                 | `openssl rand -hex 32`                                       |
| `NEXTAUTH_SECRET`             | `openssl rand -base64 32`                                    |
| `DATABASE_URL`                | `postgresql://pace:pace_local_pw@localhost:5432/pace_dev`    |
| `DIRECT_URL`                  | same as `DATABASE_URL` locally                               |
| `REDIS_URL`                   | `redis://localhost:6379`                                     |

For the mobile app, create `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_API_URL=https://your-vercel-deployment.vercel.app
```

### 3. Local infrastructure

```bash
docker-compose up -d
# Starts postgres:5432 and redis:6379
```

### 4. Database

```bash
cd packages/db
npx prisma migrate dev
npx prisma generate
```

### 5. Start the web app

```bash
cd apps/web
pnpm dev
# -> http://localhost:3000
```

### 6. Start the mobile app

```bash
cd apps/mobile
pnpm start
# Opens Expo DevTools — press 'i' for iOS Simulator
```

### 7. Connect Strava

Go to `http://localhost:3000/api/strava/auth` → authorize → initial sync starts in the background.

To force a manual re-sync:

```bash
curl -X POST http://localhost:3000/api/strava/sync \
  -H "Cookie: pace_user_id=<your-user-id>"
```

---

## Strava local development configuration

To make OAuth callback work locally, expose your server with ngrok:

```bash
npx ngrok http 3000
# Copy the public URL, e.g. https://abc123.ngrok.io
```

Update `apps/web/.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

In `strava.com/settings/api`, set **Authorization Callback Domain** to `abc123.ngrok.io`.

**Production / Vercel:** Strava allows **only one** callback domain per API application. If that field still points to localhost (or your old ngrok host), production OAuth fails with `redirect_uri mismatch`. Set **Authorization Callback Domain** to exactly your deployment host (e.g. `pace-web-nine.vercel.app` — no `https://`, no trailing slash).

To register the real-time webhook:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID \
  -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=https://abc123.ngrok.io/api/strava/webhook \
  -F verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN
```

---

## Deployment (Vercel + Supabase)

1. Fork/push to GitHub
2. Import the project in Vercel
3. **Root Directory must be `apps/web`.** Leaving the repo root causes Vercel to not detect Next.js and fall back to a static deploy.
4. **Framework Preset** should auto-detect **Next.js**. Leave **Output Directory** empty — do not force `public`.
5. `apps/web/vercel.json` sets `installCommand` and `buildCommand` so pnpm runs from the monorepo root (needed for `workspace:*` and Prisma generate).
6. Configure all environment variables in the Vercel dashboard (see table above).
7. Set `DATABASE_URL` (Supabase pooler) and `DIRECT_URL` (direct `5432` for migrations).
8. In [Upstash](https://console.upstash.com/) create a Redis database; set `REDIS_URL` to the `rediss://…` URL.
9. Update `NEXT_PUBLIC_APP_URL` to your production domain.
10. Update the Strava webhook callback URL to your production domain.
11. Apply migrations: `npx prisma migrate deploy`

---

## Useful scripts

```bash
# Dev
pnpm dev                           # Start Next.js in watch mode
cd apps/mobile && pnpm start       # Start Expo DevTools

# DB
pnpm --filter @pace/db db:migrate  # Apply migrations
pnpm --filter @pace/db db:generate # Regenerate Prisma client

# Build
pnpm build                         # Build all packages
pnpm --filter web build            # Build web app only

# Tests
pnpm --filter web test             # Run unit tests
pnpm --filter web test:watch       # Watch mode
pnpm --filter web test:coverage    # Coverage report (text + lcov)

# Docker
docker-compose up -d               # Start postgres + redis
docker-compose down                # Stop services
docker-compose down -v             # Stop and remove volumes
```

---

## License

MIT
