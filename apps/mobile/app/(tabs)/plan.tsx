import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { apiFetch } from "@/lib/api";

interface TrainingDay {
  id: string;
  date: string;
  title: string;
  description: string;
  workoutType: string;
  durationMin: number;
  willTrain: boolean | null;
}

interface GoalData {
  id: string;
  title: string;
  goalType: string;
  targetDate: string;
  trainingPlan: { id: string; days: TrainingDay[] } | null;
}

interface GoalResponse {
  goal: GoalData | null;
}

const TYPE_ICONS: Record<string, string> = {
  easy: "🏃", tempo: "⚡", long: "🛣️",
  workout: "💪", race: "🏁", unknown: "😴",
};

const MONTH_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export default function PlanScreen() {
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoal();
  }, []);

  async function loadGoal() {
    setLoading(true);
    try {
      const res = await apiFetch<GoalResponse>("/api/goals");
      setGoal(res.goal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleDay(day: TrainingDay, value: boolean) {
    if (!goal) return;
    const dayStr = new Date(day.date).toISOString().split("T")[0];
    const next = day.willTrain === value ? null : value;

    // Optimistic update
    setGoal((g) => {
      if (!g?.trainingPlan) return g;
      return {
        ...g,
        trainingPlan: {
          ...g.trainingPlan,
          days: g.trainingPlan.days.map((d) =>
            d.id === day.id ? { ...d, willTrain: next } : d,
          ),
        },
      };
    });

    await apiFetch(`/api/goals/${goal.id}/plan/days/${dayStr}`, {
      method: "PATCH",
      body: JSON.stringify({ willTrain: next }),
    }).catch(() => loadGoal());
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#f97316" />
      </View>
    );
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🎯</Text>
        <Text style={styles.emptyTitle}>Sin objetivo activo</Text>
        <Text style={styles.emptySub}>
          Crea un objetivo en la web para ver tu plan aquí.
        </Text>
      </View>
    );
  }

  const today = new Date().toISOString().split("T")[0]!;
  const days = goal.trainingPlan?.days ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.goalBadge}>
          <Text style={styles.goalBadgeText}>🎯 {goal.title}</Text>
        </View>
        <Text style={styles.goalDate}>
          {new Date(goal.targetDate).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </Text>
        <Text style={styles.daysCount}>{days.length} días de entrenamiento</Text>
      </View>

      {days.map((day) => {
        const d = new Date(day.date);
        const dayStr = d.toISOString().split("T")[0]!;
        const isPast = dayStr < today;
        const isToday = dayStr === today;
        const isRest = day.workoutType === "unknown";
        const isRace = day.workoutType === "race";

        return (
          <View
            key={day.id}
            style={[
              styles.dayCard,
              isRace && styles.dayCardRace,
              day.willTrain === true && styles.dayCardTrain,
              day.willTrain === false && styles.dayCardSkip,
            ]}
          >
            <View style={styles.dayDate}>
              <Text style={styles.dayNum}>{d.getUTCDate()}</Text>
              <Text style={styles.dayMon}>{MONTH_SHORT[d.getUTCMonth()]}</Text>
            </View>

            <Text style={styles.dayIcon}>{TYPE_ICONS[day.workoutType] ?? "🏃"}</Text>

            <View style={styles.dayBody}>
              <View style={styles.dayTitleRow}>
                <Text style={styles.dayTitle}>{day.title}</Text>
                {isToday && <Text style={styles.todayBadge}>hoy</Text>}
              </View>
              {!isRest && day.durationMin > 0 && (
                <Text style={styles.dayDuration}>⏱ ~{day.durationMin} min</Text>
              )}
              <Text style={styles.dayDesc} numberOfLines={2}>{day.description}</Text>

              {!isRest && !isRace && !isPast && (
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, day.willTrain === true && styles.toggleYes]}
                    onPress={() => toggleDay(day, true)}
                  >
                    <Text style={[styles.toggleText, day.willTrain === true && styles.toggleYesText]}>
                      ✓ Voy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, day.willTrain === false && styles.toggleNo]}
                    onPress={() => toggleDay(day, false)}
                  >
                    <Text style={[styles.toggleText, day.willTrain === false && styles.toggleNoText]}>
                      ✗ No voy
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d1a" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: "#060d1a", justifyContent: "center", alignItems: "center", padding: 40 },
  header: { marginBottom: 24 },
  goalBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.25)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  goalBadgeText: { fontSize: 13, fontWeight: "700", color: "#f97316" },
  goalDate: { fontSize: 22, fontWeight: "700", color: "#f1f5f9" },
  daysCount: { fontSize: 12, color: "#475569", marginTop: 4 },
  dayCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  dayCardRace: {
    backgroundColor: "rgba(249,115,22,0.08)",
    borderColor: "rgba(249,115,22,0.25)",
  },
  dayCardTrain: {
    backgroundColor: "rgba(74,222,128,0.06)",
    borderColor: "rgba(74,222,128,0.2)",
  },
  dayCardSkip: { opacity: 0.5 },
  dayDate: { width: 36, alignItems: "center", flexShrink: 0 },
  dayNum: { fontSize: 20, fontWeight: "700", color: "#f1f5f9", lineHeight: 22 },
  dayMon: { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  dayIcon: { fontSize: 20, paddingTop: 2, flexShrink: 0 },
  dayBody: { flex: 1, minWidth: 0 },
  dayTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  dayTitle: { fontSize: 14, fontWeight: "700", color: "#f1f5f9", flex: 1 },
  todayBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#f97316",
    backgroundColor: "rgba(249,115,22,0.15)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  dayDuration: { fontSize: 11, color: "#64748b", marginBottom: 4 },
  dayDesc: { fontSize: 12, color: "#64748b", lineHeight: 17, marginBottom: 10 },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toggleYes: { backgroundColor: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.3)" },
  toggleNo: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  toggleText: { fontSize: 11, fontWeight: "600", color: "#475569" },
  toggleYesText: { color: "#4ade80" },
  toggleNoText: { color: "#ef4444" },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#f1f5f9", marginBottom: 8 },
  emptySub: { fontSize: 13, color: "#475569", textAlign: "center", lineHeight: 20 },
  error: { color: "#f87171" },
});
