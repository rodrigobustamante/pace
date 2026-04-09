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

  if (
    event.object_type === "activity" &&
    ["create", "update"].includes(event.aspect_type)
  ) {
    // Respond immediately — process in background so Strava doesn't retry
    syncSingleActivity(String(event.owner_id), event.object_id as number).catch(
      console.error,
    );
  }

  return NextResponse.json({ ok: true });
}
