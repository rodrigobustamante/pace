import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

const HISTORY_TTL = 60 * 60 * 24 * 7; // 7 days

type GeminiRole = "user" | "model";

function historyKey(userId: string, conversationId: string) {
  return `coach:chat:${userId}:${conversationId}`;
}

/**
 * GET /api/coach/conversations
 *   → returns list of past conversations: [{ conversationId, preview, updatedAt, messageCount }]
 *
 * GET /api/coach/conversations?id=<conversationId>
 *   → returns messages for that conversation: { messages: [{ role, content, createdAt }] }
 *     also warms Redis cache for subsequent chat sends
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("id");

  // ── Single conversation history ──────────────────────────────────────────
  if (conversationId) {
    const messages = await prisma.coachChat.findMany({
      where: { userId: user.id, conversationId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true, createdAt: true },
    });

    // Warm Redis cache so the next send is fast
    if (messages.length > 0) {
      const history = messages.map((m) => ({
        role: m.role as GeminiRole,
        parts: [{ text: m.content }],
      }));
      const key = historyKey(user.id, conversationId);
      const existing = await redis.get(key);
      if (!existing) {
        await redis.setex(key, HISTORY_TTL, JSON.stringify(history));
      }
    }

    return Response.json({ messages });
  }

  // ── Conversation list ────────────────────────────────────────────────────
  const groups = await prisma.coachChat.groupBy({
    by: ["conversationId"],
    where: { userId: user.id },
    _max: { createdAt: true },
    _count: { id: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 20,
  });

  // Fetch first user message per conversation as a preview (N reads, max 20)
  const conversations = await Promise.all(
    groups.map(async (g) => {
      const first = await prisma.coachChat.findFirst({
        where: { userId: user.id, conversationId: g.conversationId, role: "user" },
        orderBy: { createdAt: "asc" },
        select: { content: true },
      });
      return {
        conversationId: g.conversationId,
        preview: (first?.content ?? "Conversación").slice(0, 60),
        updatedAt: g._max.createdAt,
        messageCount: g._count.id,
      };
    }),
  );

  return Response.json({ conversations });
}
