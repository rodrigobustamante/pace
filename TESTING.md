# Unit testing with Vitest

This repository uses Vitest for fast unit tests in `packages/utils` and `apps/web`.

## Commands

- `pnpm test`: runs all workspace tests via Turbo.
- `pnpm test:watch`: watch mode for local development.
- `pnpm test:coverage`: runs tests with coverage reports.

Coverage reports are generated in each workspace `coverage` directory with `text` and `lcov` reporters.

## Scope and conventions

- Keep tests close to source files (`*.test.ts`).
- Prioritize pure business logic and branch-heavy code.
- For API routes, mock external integrations (`auth`, `redis`, Gemini clients, context services).
- Avoid large prompt snapshots; assert key sections/behavior instead.
- Use deterministic test data and explicit expectations for numeric rounding.

## API routes with unit tests (high-risk first)

- `api/auth/logout` — redirect and cookie clear.
- `api/strava/auth` — OAuth redirect URL (mock `redirect` from `next/navigation`).
- `api/strava/callback` — error paths, token exchange failure, web vs mobile redirect, DB failure.
- `api/strava/webhook` — verification handshake and activity events (mock `syncSingleActivity`).
- `api/strava/sync` — auth, cooldown, GET status, POST sync kickoff (mock Redis + `syncActivities`).
- `api/goals` — GET/POST validation, plan generation failure cleanup, success path (mock Prisma + Gemini service).
- `api/activities` — query validation and paginated list (mock `getCurrentUser` + Prisma).
- `api/coach/chat` and `api/coach/daily` — see existing `route.test.ts` files.

Other routes can follow the same pattern when they change or when regressions appear.

## Current coverage policy

- `packages/utils` thresholds are set to `90%` for lines/functions/branches/statements.
- `apps/web` thresholds are set to `90%` for lines/functions/statements and `80%` for branches.
- Thresholds should be raised incrementally as coverage matures.
