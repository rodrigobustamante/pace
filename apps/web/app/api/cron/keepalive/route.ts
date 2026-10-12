import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { isCronRequest } from "@/lib/cron";

/**
 * GET /api/cron/keepalive — daily Vercel Cron.
 *
 * Free tiers shut idle stores down: Supabase pauses a project after about a
 * week without activity, and Upstash archives inactive databases. One real
 * query to each a day keeps both awake even when nobody uses the app.
 * Responds 500 when either fails, so the failure shows up in Vercel's cron logs.
 */
export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [db, cache] = await Promise.allSettled([
    prisma.user.count(),
    redis.set("keepalive:last", new Date().toISOString(), "EX", 7 * 86400),
  ]);

  const result = {
    db: db.status === "fulfilled" ? "ok" : String(db.reason),
    redis: cache.status === "fulfilled" ? "ok" : String(cache.reason),
  };
  const ok = db.status === "fulfilled" && cache.status === "fulfilled";
  if (!ok) console.error("[cron/keepalive] failed:", result);

  return NextResponse.json(result, { status: ok ? 200 : 500 });
}
