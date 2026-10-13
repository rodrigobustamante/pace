# PACE — Roadmap

> Feature backlog and phase planning. Reference with `@ROADMAP.md` when planning or implementing.

---

## ✅ Phase 0 — Visual prototype (DONE)

- React dashboard with mock data
- 4 sections: Overview, Activities, Metrics, AI Coach
- UX and component validation

---

## ✅ Phase 1 — Foundation (DONE)

**1A — Project setup**
- [x] Initialize monorepo with Turborepo
- [x] Next.js 14 + TypeScript + Vanilla Extract
- [x] Docker Compose (postgres + redis)
- [x] Initial Prisma schema
- [x] Environment variables (`.env.example`)

**1B — Strava OAuth**
- [x] Strava app registration (Client ID + Secret already available)
- [x] OAuth 2.0 flow: `/api/strava/auth` → callback → token exchange
- [x] Secure storage of `access_token` + `refresh_token` in DB
- [x] Automatic refresh middleware (tokens expire every 6h)
- [x] Disconnect endpoint (`/api/auth/logout`)

**1C — Activity sync**
- [x] Initial pull: last 200 activities via `GET /athlete/activities`
- [x] Filter `type: "Run"` only
- [x] Normalize and persist to DB (`Activity` table)
- [x] Strava webhook for real-time sync of new activities
- [x] `waitUntil` background sync as fallback

**1D — Basic dashboard**
- [x] Replace prototype mock data with real data
- [x] Paginated activity list
- [x] Real weekly KPIs
- [x] Welcome page (first-time user flow)

---

## ✅ Phase 2 — Advanced metrics (DONE)

- [x] CTL/ATL/TSB calculation (Banister/Coggan model) — `packages/utils/fitness.ts`
- [x] Personalized HR zones (5-zone model, maxHR config in settings) — `packages/utils/zones.ts`
- [x] Week-over-week pace, cadence, HR evolution — metrics page with Recharts
- [x] Race predictor (Riegel formula) — `packages/utils/predictor.ts` + `/api/metrics/predictions`
- [x] Recharts graphs — all Phase 0 charts with real data

---

## 🔄 Phase 3 — AI Coach (IN PROGRESS)

- [x] `/api/coach/weekly` — Gemini weekly summary, cache Redis until Monday
- [x] `/api/coach/activity/:id` — individual activity analysis, cache 24h
- [x] `/api/coach/daily` — daily recommendation: train vs rest, with session type, duration, intensity; cache until midnight
- [x] Structured prompts with real athlete context (CTL/ATL/TSB, HR zones, sessions)
- [x] `responseMimeType: "application/json"` to prevent JSON truncation from Gemini
- [x] Insight caching (Redis) — weekly: 24h, activity: 24h, daily: until midnight
- [x] Pattern detection via Gemini prompt context (overtraining, TSB trend, consecutive days)
- [x] Timezone-aware date calculations — all routes read `X-User-Timezone` header; client hooks send `Intl.DateTimeFormat().resolvedOptions().timeZone`
- [x] Daily coach respects training plan — plan is primary authority; only overrides on hard physiological stops (TSB < -20, consecutive days ≥ 5, ATL > 2×CTL)
- [x] Response streaming (SSE) — `/api/coach/weekly` emits `chunk`/`done`/`error` SSE events; hook accumulates live tokens; page shows partial summary while Gemini generates

---

## 🔄 Phase 3.5 — Coach & Goals improvements (IN PROGRESS)

### ✅ Race milestones
- [x] Multiple active milestones — `Goal` table extended with `location`, `priority` ("A"/"B"/"C") and compound index
- [x] `GET /api/goals` returns all active milestones sorted by date; `POST` no longer deactivates existing ones; `DELETE` soft-deletes (`isActive=false`); `PATCH` updates title/location/priority
- [x] Training plan generator receives full milestone list; mini-taper injected before B/C-races in prompt
- [x] `buildGoalContext` exposes `allMilestones` and selects the nearest upcoming as "active"
- [x] Timeline UI: horizontal scroll of milestone cards with priority badge, location, countdown and delete; `PlanPageClient` manages selected milestone; `GoalForm` has location + priority selector
- [ ] HR zones synced with Strava (`GET /athlete/zones`) — fall back to formula if unavailable

### ✅ Strength training
- [x] `strength` added to `RunType` enum (Prisma + `@pace/types`) with migration `20260523000001_add_strength_run_type`
- [x] Training plan prompt generates 1–2 strength days/week; rules: no strength 3 days before race, reduced during taper, concrete exercise descriptions per session
- [x] `TrainingDayCard` renders strength with 🏋️ icon, pink "Fuerza" pill, no pace/zone targets displayed

### ✅ Auto-calculated effort level (feel) from HR
- [x] `calculateFeel(avgHRbpm, maxHR)` → `1|2|3|4|5|null` in `packages/utils/src/zones.ts` (maps HR zones to RPE scale)
- [x] `feelLabel(feel)` → "Muy fácil" / "Fácil" / "Moderado" / "Duro" / "Máximo"
- [x] `feelColor(feel)` → blue → green → yellow → orange → red
- [x] `feel` computed and persisted at sync time (both bulk sync and single-activity webhook path)
- [x] `POST /api/admin/backfill-feel` — one-off backfill for existing activities with HR but no feel
- [x] `ActivityRow` shows color-coded dots + label using `feelLabel`/`feelColor`
- [x] `feel` included in `recentActivities` of weekly coach context; passed to training plan prompt as `[esfuerzo N/5]`
- [x] `inferRunType` uses HR zones as fallback when activity name has no keyword signal (Z3 → tempo, Z4+ → workout)

### ✅ Background sync every 1h
- [x] `lastSyncedAt` stored in Redis (`sync:last:{userId}`); cooldown key (`sync:cooldown:{userId}`) enforces 1h minimum between syncs
- [x] `useAutoSync` hook — on dashboard mount calls `GET /api/strava/sync`; if `canSync: true`, auto-triggers `POST /api/strava/sync` (fire-and-forget)
- [x] Shell indicator switches to amber pulsing dot + "Sincronizando…" while fetch is in flight, back to green "Sincronizado" when done
- [x] Webhook remains primary real-time channel; 1h poll is fallback

### ✅ Adaptive plan on missed training day
- [x] `POST /api/goals/:id/check-missed` — finds past non-rest/non-race days with `willTrain === null`, cross-references with Strava activities in DB, marks unmatched as `willTrain = false`
- [x] Debounced via Redis (`adaptive:checked:{goalId}`, 23h TTL) — runs at most once per day per goal
- [x] `MissedDaysBanner` component — mounted on plan page, calls check-missed on load, shows orange warning banner listing the skipped sessions
- [x] Banner offers "Actualizar plan" (calls existing `/regenerate` endpoint) and "Ignorar" actions
- [x] Regeneration passes existing compliance notes (missed days already marked) so Gemini redistributes load correctly

### ✅ Persistent coach chat
- [x] Chat history persisted to DB (`CoachChat` table: userId, conversationId, role, content, createdAt) — migration `20260523000002_add_coach_chat`
- [x] Load last N turns on page load so conversation survives refreshes and sessions (Redis cache warm on load)
- [x] Conversation list in UI: "📋 Historial" panel lists past conversations with preview + date; click to resume; "+ Nueva conversación" to start fresh
- [x] Redis used as write-through cache (fast reads on DB miss → warms cache; updated after each turn)

### Multi-model AI support
- [x] Abstract AI provider into a `services/ai/provider.ts` interface (not Gemini-specific)
- [x] Support Gemini, OpenAI (GPT-4o), Anthropic (Claude), and any OpenAI-compatible endpoint
- [x] Auto-detect available providers from env vars: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- [x] User-level model preference stored in DB (`User.preferredModel`) — selectable from settings UI
- [x] Fallback chain: if preferred model is unavailable, fall back gracefully

---

## 🔄 Phase 4 — Mobile (IN PROGRESS)

### ✅ Phase 4a — Foundation
- [x] JWT auth for mobile: `lib/jwt.ts` (signAccessToken / signRefreshToken / verify), `getUserFromRequest` extended to accept `Authorization: Bearer`
- [x] Strava OAuth callback: sessionCode one-time flow (5-min Redis TTL, never exposes raw userId)
- [x] `/api/auth/mobile/session` — exchange sessionCode → JWT + refresh token (90d, rotated)
- [x] `/api/auth/mobile/refresh` — token rotation with Redis revocation support
- [x] `/api/user/me` — profile endpoint for mobile header
- [x] Expo SDK 55 app scaffold: `package.json`, `app.json` (scheme: "pace"), `metro.config.js` (monorepo symlinks), `tsconfig.json`, `babel.config.js`
- [x] Deep link auth flow: `app/auth/index.tsx` (Strava button) + `app/auth/callback.tsx` (sessionCode exchange)
- [x] SecureStore token management (`lib/auth.ts`) + Zustand auth store
- [x] Typed `apiFetch<T>` client with Bearer header, auto-refresh on 401, timezone header

### ✅ Phase 4b — Overview + Activities
- [x] `/api/activities/[id]` single-activity endpoint
- [x] Tab navigator (Inicio / Actividades / Métricas / Coach) with Ionicons
- [x] Overview screen: weekly KPIs, CTL/ATL/TSB tiles, TSB status hint, DailyCoachCard (compact), RiskCard
- [x] `useMetrics`, `useCoachDaily`, `useRisk`, `useActivities` (infinite scroll), `useActivityDetail` hooks
- [x] Activities list: FlatList with infinite scroll + pull-to-refresh, feel color dots
- [x] Activity detail: full stats grid + lazy AI coach analysis

### ✅ Phase 4c — Metrics + Coach chat
- [x] `FitnessChart` (CTL/ATL/TSB 90-day line chart via react-native-gifted-charts)
- [x] `WeeklyBarChart` (12-week km volume)
- [x] `ZoneBar` (stacked zone distribution with minutes + %)
- [x] Metrics screen: all charts + annual stats + personal records (5K/10K/21K/42K)
- [x] Coach screen: full DailyCoachCard + "Hablar con el coach" CTA
- [x] Coach chat: streaming plain-text via `ReadableStream.getReader()`, KeyboardAvoidingView, new conversation button

### ✅ Phase 4d — Push Notifications
- [x] `User.expoPushToken String?` DB field + migration `20260523000004`
- [x] `/api/user/push-token` — register Expo push token on login
- [x] `/api/notifications/weekly` — Vercel Cron (Monday 08:00 UTC), sends via Expo Push API, chunked 100/req
- [x] `vercel.json` cron schedule: `0 8 * * 1`
- [x] Push token registration in root layout after authentication

### 📋 Phase 4 — Future iterations
- [ ] Apple HealthKit integration (HRV, sleep, VO2Max) — separate phase
- [ ] iOS home screen widget with weekly KPIs
- [ ] Offline support / background sync
