import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncActivities } from "@/services/strava/sync";
import { cache } from "@/lib/cache";

const COOLDOWN_TTL = 3600; // 1 hour in seconds

function cooldownKey(userId: string) { return `sync:cooldown:${userId}`; }
function lastSyncKey(userId: string) { return `sync:last:${userId}`; }

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [ttl, lastSyncAt] = await Promise.all([
    cache.ttl(cooldownKey(user.id)),
    cache.get(lastSyncKey(user.id)),
  ]);

  const canSync = ttl <= 0;
  return NextResponse.json({
    canSync,
    remainingSeconds: canSync ? 0 : ttl,
    lastSyncAt: lastSyncAt ?? null,
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ttl = await cache.ttl(cooldownKey(user.id));
  if (ttl > 0) {
    return NextResponse.json(
      { error: "Sync en cooldown", remainingSeconds: ttl },
      { status: 429 },
    );
  }

  const now = new Date().toISOString();
  await Promise.all([
    cache.setex(cooldownKey(user.id), COOLDOWN_TTL, "1"),
    cache.set(lastSyncKey(user.id), now),
  ]);

  // Fire and return immediately — sync runs in background
  syncActivities(user.id).catch(console.error);

  return NextResponse.json({ ok: true, lastSyncAt: now });
}
