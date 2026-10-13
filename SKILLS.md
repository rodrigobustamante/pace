# SKILLS.md — Technical patterns for the PACE project

> Implementation guide for Claude Code. Complements CLAUDE.md.

---

## 1. Strava OAuth — Full implementation

### File: `app/api/strava/auth/route.ts`

```typescript
import { redirect } from "next/navigation";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`,
    response_type: "code",
    scope: "activity:read_all",
    approval_prompt: "auto",
  });
  redirect(`${STRAVA_AUTH_URL}?${params}`);
}
```

### File: `app/api/strava/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { syncActivities } from "@/services/strava/sync";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect("/auth/error");

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  const { access_token, refresh_token, expires_at, athlete } =
    await tokenRes.json();

  // Upsert user record
  const user = await prisma.user.upsert({
    where: { stravaAthleteId: athlete.id },
    create: {
      stravaAthleteId: athlete.id,
      name: `${athlete.firstname} ${athlete.lastname}`,
      profileImageUrl: athlete.profile,
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      tokenExpiresAt: new Date(expires_at * 1000),
    },
    update: {
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      tokenExpiresAt: new Date(expires_at * 1000),
    },
  });

  // Kick off initial sync in background — don't await
  syncActivities(user.id).catch(console.error);

  // Set session cookie and redirect to dashboard
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("pace_user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
```

---

## 2. Strava client with automatic token refresh

### File: `lib/strava/client.ts`

```typescript
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export async function getStravaClient(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  let accessToken = decrypt(user.accessToken);

  // Refresh proactively if token expires within 10 minutes
  if (user.tokenExpiresAt < new Date(Date.now() + 10 * 60 * 1000)) {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: decrypt(user.refreshToken),
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    accessToken = data.access_token;

    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: encrypt(data.access_token),
        refreshToken: encrypt(data.refresh_token),
        tokenExpiresAt: new Date(data.expires_at * 1000),
      },
    });
  }

  return {
    get: (path: string, params?: Record<string, string>) => {
      const url = new URL(`https://www.strava.com/api/v3${path}`);
      if (params)
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      return fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json());
    },
  };
}
```

---

## 3. Activity sync — Initial pull + pagination

### File: `services/strava/sync.ts`

```typescript
import { getStravaClient } from "@/lib/strava/client";
import { prisma } from "@/lib/db";
import { normalizeActivity } from "./normalize";

export async function syncActivities(userId: string, since?: Date) {
  const client = await getStravaClient(userId);
  let page = 1;
  const perPage = 200;
  let hasMore = true;

  while (hasMore) {
    const params: Record<string, string> = {
      per_page: String(perPage),
      page: String(page),
    };
    if (since) params.after = String(Math.floor(since.getTime() / 1000));

    const activities = await client.get("/athlete/activities", params);

    if (!Array.isArray(activities) || activities.length === 0) {
      hasMore = false;
      break;
    }

    // Filter running activities only
    const runs = activities.filter(
      (a: any) => a.type === "Run" || a.sport_type === "Run",
    );

    // Upsert in parallel batches of 10
    const batches = chunk(runs, 10);
    for (const batch of batches) {
      await Promise.all(
        batch.map((raw: any) =>
          prisma.activity.upsert({
            where: { stravaId: raw.id },
            create: { ...normalizeActivity(raw, userId) },
            update: { ...normalizeActivity(raw, userId) },
          }),
        ),
      );
    }

    hasMore = activities.length === perPage;
    page++;
  }
}

export async function syncSingleActivity(
  stravaAthleteId: string,
  stravaActivityId: number,
) {
  const user = await prisma.user.findFirst({
    where: { stravaAthleteId: Number(stravaAthleteId) },
  });
  if (!user) return;

  const client = await getStravaClient(user.id);
  const raw = await client.get(`/activities/${stravaActivityId}`);

  if (raw.type !== "Run" && raw.sport_type !== "Run") return;

  await prisma.activity.upsert({
    where: { stravaId: raw.id },
    create: { ...normalizeActivity(raw, user.id) },
    update: { ...normalizeActivity(raw, user.id) },
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
```

### File: `services/strava/normalize.ts`

```typescript
import type { Prisma } from "@prisma/client";

export function normalizeActivity(
  raw: any,
  userId: string,
): Prisma.ActivityCreateInput {
  return {
    stravaId: raw.id,
    user: { connect: { id: userId } },
    name: raw.name,
    type: inferRunType(raw),
    date: new Date(raw.start_date),
    distanceM: raw.distance,
    durationSec: raw.moving_time,
    paceSeckm:
      raw.distance > 0
        ? Math.round(raw.moving_time / (raw.distance / 1000))
        : 0,
    avgHRbpm: raw.average_heartrate ?? null,
    maxHRbpm: raw.max_heartrate ?? null,
    // Strava returns spm (steps per minute) — multiply by 2 for strides per minute
    cadenceRpm: raw.average_cadence
      ? Math.round(raw.average_cadence * 2)
      : null,
    elevationM: raw.total_elevation_gain ?? null,
    caloriesKcal: raw.calories ?? null,
    stravaData: raw,
  };
}

function inferRunType(raw: any): string {
  const name = (raw.name || "").toLowerCase();
  const workoutType = raw.workout_type; // Strava's own classification

  if (workoutType === 1) return "race";
  if (workoutType === 2) return "long";
  if (workoutType === 3) return "workout";
  if (
    name.includes("tempo") ||
    name.includes("interval") ||
    name.includes("fartlek")
  )
    return "tempo";
  if (name.includes("largo") || name.includes("long")) return "long";
  if (name.includes("recup") || name.includes("easy") || name.includes("fácil"))
    return "easy";
  return "easy"; // conservative default
}
```

---

## 4. Metrics calculation — CTL/ATL/TSB

### File: `lib/metrics/fitness.ts`

```typescript
export interface DailyLoad {
  date: string; // YYYY-MM-DD
  tss: number;
}

export interface FitnessPoint {
  date: string;
  ctl: number; // Chronic Training Load (Fitness)
  atl: number; // Acute Training Load (Fatigue)
  tsb: number; // Training Stress Balance (Form)
}

export function calculateFitness(
  dailyLoads: DailyLoad[],
  initialCtl = 0,
  initialAtl = 0,
): FitnessPoint[] {
  const TAU_CTL = 42; // days — long-term fitness constant
  const TAU_ATL = 7; // days — short-term fatigue constant

  const sorted = [...dailyLoads].sort((a, b) => a.date.localeCompare(b.date));
  const result: FitnessPoint[] = [];

  let ctl = initialCtl;
  let atl = initialAtl;

  for (const { date, tss } of sorted) {
    ctl = ctl + (tss - ctl) / TAU_CTL;
    atl = atl + (tss - atl) / TAU_ATL;
    result.push({
      date,
      ctl: round(ctl),
      atl: round(atl),
      tsb: round(ctl - atl),
    });
  }

  return result;
}

// HR-based running TSS (simplified Skiba method)
export function calculateRunTSS(
  durationSec: number,
  avgHR: number,
  thresholdHR: number,
): number {
  const intensityFactor = avgHR / thresholdHR;
  const tss =
    ((durationSec * avgHR * intensityFactor) / (thresholdHR * 3600)) * 100;
  return round(tss);
}

// Estimated threshold HR when no lactate test is available
export function estimateThresholdHR(maxHR: number): number {
  return Math.round(maxHR * 0.89);
}

function round(n: number, decimals = 1): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}
```

---

## 5. AI Coach — Streaming with Gemini

> MVP uses **Google Gemini 2.5 Flash**. The streaming pattern and prompt structure
> are provider-agnostic and straightforward to migrate to another LLM.

### Install

```bash
pnpm add @google/generative-ai
```

### File: `app/api/coach/weekly/route.ts`

```typescript
import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromRequest } from "@/lib/auth";
import { buildWeeklyContext } from "@/services/coach/context";
import { redis } from "@/lib/redis";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Return cached response if available within the same week
  const cacheKey = `coach:weekly:${user.id}:${getWeekKey()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const context = await buildWeeklyContext(user.id);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: COACH_SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.4, // Low temp for consistent, data-driven responses
      responseMimeType: "application/json", // Returns clean JSON — no markdown fences to strip
    },
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const result = await model.generateContentStream(
          buildWeeklyPrompt(context),
        );

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }

        // Cache result for 24h
        await redis.setex(cacheKey, 86400, fullResponse);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("Gemini error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Coach unavailable" })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function getWeekKey(): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return startOfWeek.toISOString().split("T")[0];
}

// System instruction is in English (model layer).
// Prompt content and JSON output are in Spanish (athlete-facing UI layer).
const COACH_SYSTEM_PROMPT = `You are an expert, personalized running coach in the style of Runna.
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
}`;

function buildWeeklyPrompt(ctx: WeeklyContext): string {
  return `Athlete: ${ctx.userName}
Max HR: ${ctx.maxHR ?? "not set"} bpm | Threshold HR: ${ctx.thresholdHR} bpm

Current form:
- CTL (Fitness): ${ctx.ctl} | ATL (Fatigue): ${ctx.atl} | TSB (Form): ${ctx.tsb} ${ctx.tsb < -10 ? "⚠️" : ctx.tsb > 5 ? "✓" : ""}
- Trend: ${ctx.tsbTrend}

This week (${ctx.weekStart} to ${ctx.weekEnd}):
- Total km: ${ctx.weeklyKm.toFixed(1)} | Sessions: ${ctx.activitiesCount} | TSS: ${ctx.weeklyTSS}
- Avg pace: ${ctx.avgPaceFormatted} min/km | Avg HR: ${ctx.avgHR} bpm
- Zone distribution: ${ctx.zoneDistribution}

Previous week: ${ctx.prevWeekKm.toFixed(1)} km, TSS ${ctx.prevWeekTSS} (volume change: ${ctx.volumeChangePct > 0 ? "+" : ""}${ctx.volumeChangePct}%)

Last 3 activities:
${ctx.recentActivities.map((a) => `- ${a.date}: ${a.name} — ${a.km}km @ ${a.pace}/km, HR ${a.avgHR}bpm`).join("\n")}

Generate the weekly analysis in JSON.`;
}
```

### Gemini vs other providers — key differences

- `systemInstruction` is a separate field, not part of the messages array (unlike OpenAI/Anthropic)
- `responseMimeType: 'application/json'` enforces clean JSON output — no need to strip markdown fences
- `temperature: 0.4` produces consistent, data-grounded coaching responses
- Streaming uses `generateContentStream` → iterate over `result.stream`

---

## 6. Formatting helpers — Presentation layer

### File: `lib/format.ts`

```typescript
// Meters → km with 1 decimal
export const mToKm = (meters: number): string => (meters / 1000).toFixed(1);

// Seconds → "MM:SS" (pace display)
export const secToPace = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Seconds → "HH:MM:SS" or "MM:SS" (duration display)
export const secToDuration = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
};

// TSB → human-readable form label (in Spanish for athlete UI)
export const tsbLabel = (tsb: number): string => {
  if (tsb < -20) return "Sobreentrenado";
  if (tsb < -10) return "Muy fatigado";
  if (tsb < -5) return "Algo fatigado";
  if (tsb < 5) return "Equilibrado";
  if (tsb < 15) return "Fresco";
  return "Muy descansado";
};

// HR → zone number (1–5)
export const hrZone = (hr: number, maxHR: number): 1 | 2 | 3 | 4 | 5 => {
  const pct = hr / maxHR;
  if (pct < 0.6) return 1;
  if (pct < 0.7) return 2;
  if (pct < 0.8) return 3;
  if (pct < 0.9) return 4;
  return 5;
};

// Riegel race time predictor
export const predictRaceTime = (
  knownTimeSec: number,
  knownDistM: number,
  targetDistM: number,
): number =>
  Math.round(knownTimeSec * Math.pow(targetDistM / knownDistM, 1.06));
```

---

## 7. Strava webhook — Real-time sync

### File: `app/api/strava/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { syncSingleActivity } from "@/services/strava/sync";

// Webhook verification handshake (GET)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const verify = req.nextUrl.searchParams.get("hub.verify_token");

  if (verify !== process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.json({ "hub.challenge": challenge });
}

// Receive activity events (POST)
export async function POST(req: NextRequest) {
  const event = await req.json();

  // Only care about new or updated runs
  if (
    event.object_type === "activity" &&
    ["create", "update"].includes(event.aspect_type)
  ) {
    // Process in background — respond immediately so Strava doesn't retry
    syncSingleActivity(String(event.owner_id), event.object_id).catch(
      console.error,
    );
  }

  return NextResponse.json({ ok: true });
}
```

---

## 8. Token encryption (AES-256-GCM)

### File: `lib/crypto.ts`

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // must be 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(data: string): string {
  const [ivHex, tagHex, encryptedHex] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}
```

---

## 9. Docker Compose — Local environment

### File: `docker-compose.yml`

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pace_dev
      POSTGRES_USER: pace
      POSTGRES_PASSWORD: pace_local_pw
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  postgres_data:
```

---

## 10. Recommended implementation order (Phase 1)

```
1.  pnpm create turbo@latest pace               # Monorepo scaffold
2.  cd pace && pnpm create next-app apps/web    # Next.js 14, TS, Tailwind, App Router
3.  Create packages/types, packages/utils, packages/db
4.  docker-compose up -d                        # Start postgres + redis
5.  cd packages/db && npx prisma init
6.  Write schema.prisma (see CLAUDE.md data model)
7.  npx prisma migrate dev --name init
8.  Copy env vars from .env.example → .env.local
9.  Implement lib/crypto.ts
10. Implement app/api/strava/auth/route.ts
11. Implement app/api/strava/callback/route.ts
12. Implement lib/strava/client.ts (with auto-refresh)
13. Implement services/strava/normalize.ts
14. Implement services/strava/sync.ts
15. Test full flow: login → sync → verify activities in DB
16. Port prototype UI (running-dashboard.jsx) to Next.js with real data
17. Implement app/api/strava/webhook/route.ts
18. Register webhook with Strava (needs public URL — use ngrok locally)
```

---

## 11. Local OAuth testing

```bash
# 1. Start local infrastructure
docker-compose up -d

# 2. Create a public tunnel for OAuth callback and webhooks
npx ngrok http 3000
# → Copy the public URL, e.g. https://abc123.ngrok.io
# → Update NEXT_PUBLIC_APP_URL in .env.local

# 3. In Strava Settings > API:
#    Authorization Callback Domain: abc123.ngrok.io

# 4. Register the webhook (one-time setup)
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID \
  -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=https://abc123.ngrok.io/api/strava/webhook \
  -F verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN

# 5. Test the OAuth flow
open http://localhost:3000/api/strava/auth
```

---

## 12. Visual prototype reference

The file `running-dashboard.jsx` (project root) is the **complete visual reference** from Phase 0. It contains:

- 4-tab navigation structure
- `StatCard`, `CustomTooltip`, and all Recharts component patterns
- Exact color palette and typography choices
- Mock data shaped exactly like the normalized DB objects
- `typeConfig` logic for run type colors
- `tsbLabel` mapping and TSB-based color logic

When porting to Next.js, preserve the visual output exactly. Replace only the data source (mock → API calls).
