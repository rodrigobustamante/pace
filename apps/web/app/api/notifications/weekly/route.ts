import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
}

async function sendExpoPushNotifications(messages: ExpoPushMessage[]) {
  // Expo Push API accepts up to 100 messages per request
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  const results: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(chunk),
    });
    if (res.ok) {
      const json = (await res.json()) as { data: ExpoPushTicket[] };
      results.push(...json.data);
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  // Vercel Cron authentication
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all users with a registered push token
  const users = await prisma.user.findMany({
    where: { expoPushToken: { not: null } },
    select: { id: true, name: true, expoPushToken: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const messages: ExpoPushMessage[] = users
    .filter((u) => u.expoPushToken)
    .map((u) => ({
      to: u.expoPushToken!,
      title: "📊 Tu resumen semanal está listo",
      body: `¡Hola ${u.name.split(" ")[0]}! Tu coach tiene el análisis de tu semana listo.`,
      sound: "default",
      data: { screen: "coach" },
    }));

  const tickets = await sendExpoPushNotifications(messages);
  const sent = tickets.filter((t) => t.status === "ok").length;

  return NextResponse.json({ sent, total: messages.length });
}
