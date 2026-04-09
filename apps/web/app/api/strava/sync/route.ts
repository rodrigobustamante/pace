import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncActivities } from "@/services/strava/sync";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fire and return immediately — sync runs in background
  syncActivities(user.id).catch(console.error);

  return NextResponse.json({ ok: true, message: "Sync iniciado" });
}
