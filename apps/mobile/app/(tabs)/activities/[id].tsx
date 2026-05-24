import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useActivityDetail } from "@/hooks/useActivityDetail";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { COLORS } from "@/lib/constants";

function formatDistance(m: number) {
  return (m / 1000).toFixed(2) + " km";
}

function formatPace(secPerKm: number) {
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activityQuery, analysisQuery } = useActivityDetail(id ?? "");

  const activity = activityQuery.data;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activity?.name ?? "Actividad"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {activityQuery.isLoading ? (
        <LoadingSpinner fullScreen message="Cargando…" />
      ) : activity ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Stats */}
          <Card>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            <StatRow label="Distancia" value={formatDistance(activity.distanceM)} />
            <StatRow label="Tiempo" value={formatDuration(activity.durationSec)} />
            <StatRow label="Ritmo medio" value={formatPace(activity.paceSeckm)} />
            {activity.avgHRbpm && (
              <StatRow label="FC media" value={`${activity.avgHRbpm} bpm`} />
            )}
            {activity.maxHRbpm && (
              <StatRow label="FC máxima" value={`${activity.maxHRbpm} bpm`} />
            )}
            {activity.cadenceRpm && (
              <StatRow label="Cadencia" value={`${activity.cadenceRpm} spm`} />
            )}
            {activity.elevationM !== null && activity.elevationM !== undefined && (
              <StatRow label="Desnivel" value={`${Math.round(activity.elevationM)} m`} />
            )}
            {activity.caloriesKcal && (
              <StatRow label="Calorías" value={`${activity.caloriesKcal} kcal`} />
            )}
            {activity.tss && (
              <StatRow label="TSS" value={activity.tss.toFixed(1)} />
            )}
          </Card>

          {/* Coach analysis */}
          <Card>
            <Text style={styles.sectionTitle}>Análisis del Coach</Text>
            {analysisQuery.isLoading ? (
              <LoadingSpinner message="Analizando actividad…" />
            ) : analysisQuery.data ? (
              <Text style={styles.analysisText}>
                {typeof analysisQuery.data.analysis === "string"
                  ? analysisQuery.data.analysis
                  : JSON.stringify(analysisQuery.data, null, 2)}
              </Text>
            ) : (
              <Text style={styles.noAnalysis}>Análisis no disponible.</Text>
            )}
          </Card>
        </ScrollView>
      ) : (
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Actividad no encontrada.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, alignItems: "center" },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: { fontSize: 14, color: COLORS.textMuted },
  statValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  analysisText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
  noAnalysis: { fontSize: 14, color: COLORS.textDim, fontStyle: "italic" },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { color: COLORS.textMuted, fontSize: 16 },
});
