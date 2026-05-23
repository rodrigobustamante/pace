import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PrismaClient } from "@pace/db";
import type { RunType } from "@pace/types";
import { buildWeeklyContext, localDateStr } from "@/services/coach/context";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const VALID_WORKOUT_TYPES = new Set<RunType>([
  "easy",
  "tempo",
  "long",
  "workout",
  "race",
  "strength",
  "unknown",
]);

function isValidRunType(v: unknown): v is RunType {
  return typeof v === "string" && VALID_WORKOUT_TYPES.has(v as RunType);
}

export interface MilestoneInfo {
  title: string;
  targetDate: string; // YYYY-MM-DD
  location?: string;
  priority: string; // "A" | "B" | "C"
}

export interface GenerateTrainingPlanParams {
  prisma: PrismaClient;
  userId: string;
  goalId: string;
  goalTitle: string;
  goalTargetDate: Date;
  goalLocation?: string;
  goalPriority?: string;
  /** All other upcoming milestones (excluding the one being planned) */
  otherMilestones?: MilestoneInfo[];
  /** Borra el plan actual del objetivo antes de crear uno nuevo */
  replaceExisting?: boolean;
  /** Líneas extra para el coach (cumplimiento, notas) */
  coachNotes?: string[];
  /** IANA timezone string from the client (e.g. "America/Santiago") */
  timezone?: string;
}

export async function generateAndPersistTrainingPlan(
  params: GenerateTrainingPlanParams,
) {
  const {
    prisma,
    userId,
    goalId,
    goalTitle,
    goalTargetDate,
    goalLocation,
    goalPriority = "A",
    otherMilestones = [],
    replaceExisting,
    coachNotes,
    timezone = "UTC",
  } = params;

  if (replaceExisting) {
    await prisma.trainingPlan.deleteMany({ where: { goalId } });
  }

  const ctx = await buildWeeklyContext(userId, timezone);
  const today = localDateStr(timezone);
  const raceDate = goalTargetDate.toISOString().split("T")[0]!;
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilRace = Math.ceil(
    (goalTargetDate.getTime() - Date.now()) / msPerDay,
  );

  const notesBlock =
    coachNotes && coachNotes.length > 0
      ? `\nContexto adicional del atleta:\n${coachNotes.map((n) => `- ${n}`).join("\n")}\n`
      : "";

  const priorityLabel =
    goalPriority === "A" ? "carrera principal (A-race)"
    : goalPriority === "B" ? "carrera secundaria (B-race)"
    : "carrera de entrenamiento (C-race)";

  const locationStr = goalLocation ? ` en ${goalLocation}` : "";

  const milestonesBlock =
    otherMilestones.length > 0
      ? `\nOtros hitos en el calendario del atleta (considera estos al distribuir la carga):\n${otherMilestones
          .map((m) => {
            const loc = m.location ? ` en ${m.location}` : "";
            const tag =
              m.priority === "A" ? "[A-race]"
              : m.priority === "B" ? "[B-race]"
              : "[C-race]";
            return `- ${m.targetDate}: ${m.title}${loc} ${tag}`;
          })
          .join("\n")}\n`
      : "";

  const prompt = `Eres un coach de running profesional. Genera un plan de entrenamiento estructurado en JSON.

Atleta: ${ctx.userName}
Objetivo: ${goalTitle}${locationStr} el ${raceDate} [${priorityLabel}]
Hoy: ${today}
Días hasta la carrera: ${daysUntilRace}${milestonesBlock}
Fitness actual: CTL ${ctx.ctl}, ATL ${ctx.atl}, TSB ${ctx.tsb} (${ctx.tsbTrend})
Volumen semanal reciente: ~${ctx.weeklyKm.toFixed(1)} km/semana
Ritmo medio reciente: ${ctx.avgPaceFormatted} min/km
Últimas actividades:
${ctx.recentActivities.map((a) => {
    const feelStr = a.feel != null ? ` [esfuerzo ${a.feel}/5]` : "";
    return `- ${a.date}: ${a.name} ${a.km}km @ ${a.pace}/km${feelStr}`;
  }).join("\n")}
${notesBlock}
Genera un plan día a día desde hoy (${today}) hasta el día de la carrera (${raceDate}) inclusive.

Responde ÚNICAMENTE con JSON válido en este formato exacto:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "Título corto del entrenamiento",
      "description": "Descripción detallada de qué hacer y cómo ejecutarlo",
      "workoutType": "easy|tempo|long|workout|race|strength|unknown",
      "durationMin": 45,
      "targetPace": "Rango de ritmo objetivo en min/km o null",
      "targetZone": "Zona objetivo de FC (ej: Z2 60-70% FCmax) o null"
    }
  ]
}

Reglas generales:
- workoutType "unknown" + title "Descanso" + durationMin 0 para días de descanso completo
- workoutType "race" para el día de la carrera (${raceDate})
- ~2 días de descanso por semana
- Última semana: taper (reducir volumen 30-40%)
- Adapta la intensidad al fitness actual del atleta
- Si el contexto indica sesiones saltadas o fatiga, reduce carga de forma prudente en los próximos días
- Si hay otros hitos [B-race] o [C-race] antes de la carrera objetivo, incluye un mini-taper de 3-4 días antes de cada uno y retoma carga progresiva después; no sacrifiques la preparación del [A-race]

Reglas para sesiones de running (easy/tempo/long/workout/race):
- Incluye SIEMPRE targetPace y targetZone
- targetPace debe ser un rango específico en min/km (ej: "5:20-5:35 min/km")
- targetZone debe usar nomenclatura de zonas (Z1-Z5) con rango de intensidad
- El plan debe ser realista con respecto al ritmo medio reciente (evitar ritmos extremadamente lentos o rápidos sin justificación)
- Para sesiones easy/long en Z2, propone ritmos cercanos al ritmo aeróbico actual (+20 a +80 seg/km respecto al ritmo medio reciente)
- Si hay conflicto entre ritmo y zona, la prioridad es cumplir la zona objetivo

Reglas para sesiones de fuerza (strength):
- Incluye 1-2 sesiones de fuerza por semana, preferiblemente el día siguiente a un rodaje largo o duro
- En la semana de taper, elimina o reduce a 1 sesión de fuerza muy ligera
- No incluyas fuerza los 3 días previos a la carrera
- targetPace: null, targetZone: null (no aplica para fuerza)
- durationMin: entre 30 y 50 minutos típicamente
- La description debe describir los ejercicios concretos: sentadillas, peso muerto, zancadas, core (planchas, bird-dog, dead bug), ejercicios de cadera (puentes de glúteo, clamshells). Adapta la carga a la proximidad de la carrera: más intensidad al inicio del plan, más ligero y funcional cerca de la carrera.

Reglas para descanso:
- Para descanso (unknown), usa targetPace: null y targetZone: null

Todas las descripciones en español.
NO incluyas texto fuera del JSON`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const parsed = JSON.parse(raw) as {
    days?: Array<{
      date?: unknown;
      title?: unknown;
      description?: unknown;
      workoutType?: unknown;
      durationMin?: unknown;
      targetPace?: unknown;
      targetZone?: unknown;
    }>;
  };

  if (!Array.isArray(parsed.days)) throw new Error("Invalid plan format");

  const validatedDays = parsed.days
    .filter(
      (d) =>
        typeof d.date === "string" &&
        typeof d.title === "string" &&
        typeof d.description === "string" &&
        isValidRunType(d.workoutType) &&
        typeof d.durationMin === "number",
    )
    .map((d) => ({
      userId,
      date: new Date(d.date as string),
      title: d.title as string,
      description: d.description as string,
      workoutType: d.workoutType as RunType,
      durationMin: d.durationMin as number,
      targetPace: typeof d.targetPace === "string" ? d.targetPace.trim() : null,
      targetZone: typeof d.targetZone === "string" ? d.targetZone.trim() : null,
    }));

  let plan;
  try {
    plan = await prisma.trainingPlan.create({
      data: {
        goalId,
        userId,
        days: {
          create: validatedDays,
        },
      },
      include: { days: { orderBy: { date: "asc" } } },
    });
  } catch (createErr) {
    const msg = createErr instanceof Error ? createErr.message : "";
    const hasLegacyClientMismatch =
      msg.includes("Unknown argument `targetPace`") ||
      msg.includes("Unknown argument `targetZone`");

    if (!hasLegacyClientMismatch) throw createErr;

    plan = await prisma.trainingPlan.create({
      data: {
        goalId,
        userId,
        days: {
          create: validatedDays.map(
            ({ userId: uid, date, title, description, workoutType, durationMin }) => ({
              userId: uid,
              date,
              title,
              description,
              workoutType,
              durationMin,
            }),
          ),
        },
      },
      include: { days: { orderBy: { date: "asc" } } },
    });
  }

  return plan;
}
