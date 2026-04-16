import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoalForm } from "@/components/GoalForm";
import { TrainingPlanView } from "@/components/TrainingPlanView";
import * as s from "@/styles/planPage.css";

export const metadata = { title: "Plan de Entrenamiento — PACE" };

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/strava/auth");

  const zoneRanges = user.maxHR
    ? [
        `Z1 Recuperación: < ${Math.round(user.maxHR * 0.6)} bpm`,
        `Z2 Aeróbica: ${Math.round(user.maxHR * 0.6)}-${Math.round(user.maxHR * 0.7) - 1} bpm`,
        `Z3 Umbral aeróbico: ${Math.round(user.maxHR * 0.7)}-${Math.round(user.maxHR * 0.8) - 1} bpm`,
        `Z4 Umbral alto: ${Math.round(user.maxHR * 0.8)}-${Math.round(user.maxHR * 0.9) - 1} bpm`,
        `Z5 VO2max: >= ${Math.round(user.maxHR * 0.9)} bpm`,
      ]
    : null;

  const goal = await prisma.goal.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      trainingPlan: {
        include: { days: { orderBy: { date: "asc" } } },
      },
    },
  });

  const serialized = goal
    ? {
        ...goal,
        targetDate: goal.targetDate.toISOString(),
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        trainingPlan: goal.trainingPlan
          ? {
              ...goal.trainingPlan,
              generatedAt: goal.trainingPlan.generatedAt.toISOString(),
              days: goal.trainingPlan.days.map((d) => ({
                ...d,
                date: d.date.toISOString(),
                createdAt: d.createdAt.toISOString(),
              })),
            }
          : null,
      }
    : null;

  return (
    <div>
      <div className={s.pageHead}>
        <div className={s.pageTitle}>
          Plan <span className={s.accentOrange}>de entrenamiento</span>
        </div>
        <div className={s.pageSub}>
          {serialized
            ? `${serialized.trainingPlan?.days.length ?? 0} días hacia tu objetivo`
            : "Crea un objetivo para generar tu plan personalizado"}
        </div>
      </div>

      {!serialized ? (
        <GoalForm />
      ) : (
        <TrainingPlanView goal={serialized} zoneRanges={zoneRanges} />
      )}
    </div>
  );
}
