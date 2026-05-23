import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlanPageClient, type SerializedGoal } from "@/components/PlanPageClient";
import { getTranslations } from "next-intl/server";
import * as s from "@/styles/planPage.css";

export const metadata = { title: "Plan de Entrenamiento — PACE" };

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/strava/auth");

  const t = await getTranslations("plan");

  const zoneRanges = user.maxHR
    ? [
        `${t("zones.z1")}: < ${Math.round(user.maxHR * 0.6)} bpm`,
        `${t("zones.z2")}: ${Math.round(user.maxHR * 0.6)}-${Math.round(user.maxHR * 0.7) - 1} bpm`,
        `${t("zones.z3")}: ${Math.round(user.maxHR * 0.7)}-${Math.round(user.maxHR * 0.8) - 1} bpm`,
        `${t("zones.z4")}: ${Math.round(user.maxHR * 0.8)}-${Math.round(user.maxHR * 0.9) - 1} bpm`,
        `${t("zones.z5")}: >= ${Math.round(user.maxHR * 0.9)} bpm`,
      ]
    : null;

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { targetDate: "asc" },
    include: {
      trainingPlan: {
        include: { days: { orderBy: { date: "asc" } } },
      },
    },
  });

  const serializedGoals: SerializedGoal[] = goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    goalType: goal.goalType,
    targetDate: goal.targetDate.toISOString(),
    location: goal.location ?? null,
    priority: goal.priority,
    trainingPlan: goal.trainingPlan
      ? {
          id: goal.trainingPlan.id,
          generatedAt: goal.trainingPlan.generatedAt.toISOString(),
          days: goal.trainingPlan.days.map((d) => ({
            id: d.id,
            date: d.date.toISOString(),
            title: d.title,
            description: d.description,
            workoutType: d.workoutType,
            durationMin: d.durationMin,
            targetPace: d.targetPace ?? null,
            targetZone: d.targetZone ?? null,
            willTrain: d.willTrain ?? null,
          })),
        }
      : null,
  }));

  const totalDays = serializedGoals.reduce(
    (sum, g) => sum + (g.trainingPlan?.days.length ?? 0),
    0,
  );

  return (
    <div>
      <div className={s.pageHead}>
        <div className={s.pageTitle}>
          {t("title")} <span className={s.accentOrange}>{t("titleAccent")}</span>
        </div>
        <div className={s.pageSub}>
          {serializedGoals.length > 0
            ? t("subtitle", { days: totalDays })
            : t("subtitleEmpty")}
        </div>
      </div>

      <PlanPageClient goals={serializedGoals} zoneRanges={zoneRanges} />
    </div>
  );
}
