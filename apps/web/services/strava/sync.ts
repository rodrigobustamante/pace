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

    const runs = activities.filter(
      (a: Record<string, unknown>) =>
        a.type === "Run" || a.sport_type === "Run",
    );

    const batches = chunk(runs, 10);
    for (const batch of batches) {
      await Promise.all(
        batch.map((raw: Record<string, unknown>) =>
          prisma.activity.upsert({
            where: { stravaId: BigInt(raw.id as number) },
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
    where: { stravaId: raw.id as number },
    create: { ...normalizeActivity(raw, user.id) },
    update: { ...normalizeActivity(raw, user.id) },
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
