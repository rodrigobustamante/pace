// Shared TypeScript types for the PACE monorepo

export type RunType = "easy" | "tempo" | "long" | "workout" | "race" | "unknown";

export interface Activity {
  id: string;
  stravaId: number;
  userId: string;
  name: string;
  type: RunType;
  date: Date;
  distanceM: number;
  durationSec: number;
  paceSeckm: number;
  avgHRbpm: number | null;
  maxHRbpm: number | null;
  cadenceRpm: number | null;
  elevationM: number | null;
  caloriesKcal: number | null;
  tss: number | null;
  feel: number | null;
  createdAt: Date;
}

export interface User {
  id: string;
  stravaAthleteId: number;
  name: string;
  email: string | null;
  profileImageUrl: string | null;
  maxHR: number | null;
  restingHR: number | null;
  tokenExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachInsight {
  id: string;
  userId: string;
  type: "weekly" | "activity" | "alert";
  refId: string | null;
  content: CoachInsightContent;
  createdAt: Date;
  expiresAt: Date;
}

export interface CoachInsightContent {
  title: string;
  body: string;
  type: "warning" | "positive" | "tip" | "prediction";
}

export interface WeeklyCoachResponse {
  summary: string;
  positive: { title: string; body: string };
  warning: { title: string; body: string };
  tip: { title: string; body: string };
  prediction: { title: string; body: string };
}
