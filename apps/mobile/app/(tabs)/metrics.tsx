import { ScrollView, View, Text, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMetrics } from "@/hooks/useMetrics";
import { useRecords } from "@/hooks/useRecords";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FitnessChart } from "@/components/charts/FitnessChart";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart";
import { ZoneBar } from "@/components/charts/ZoneBar";
import { COLORS } from "@/lib/constants";

export default function MetricsScreen() {
  const metricsQuery = useMetrics();
  const recordsQuery = useRecords();

  const isRefreshing = metricsQuery.isFetching || recordsQuery.isFetching;

  function onRefresh() {
    void metricsQuery.refetch();
    void recordsQuery.refetch();
  }

  const { fitness, weeklyData, zones, annualStats } = metricsQuery.data ?? {};
  const { records, longestRun } = recordsQuery.data ?? {};

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        <Text style={styles.pageTitle}>Métricas</Text>

        {/* Fitness chart */}
        <Card>
          <Text style={styles.sectionTitle}>CTL / ATL / TSB — 90 días</Text>
          {metricsQuery.isLoading ? (
            <LoadingSpinner />
          ) : (
            <FitnessChart fitness={fitness ?? []} />
          )}
        </Card>

        {/* Weekly volume */}
        <Card>
          <Text style={styles.sectionTitle}>Volumen semanal (km)</Text>
          {metricsQuery.isLoading ? (
            <LoadingSpinner />
          ) : (
            <WeeklyBarChart weeklyData={weeklyData ?? []} />
          )}
        </Card>

        {/* Zone distribution */}
        <Card>
          <Text style={styles.sectionTitle}>Distribución de zonas — 90 días</Text>
          <ZoneBar zones={zones ?? null} />
        </Card>

        {/* Annual stats */}
        {annualStats && (
          <Card>
            <Text style={styles.sectionTitle}>Año en curso</Text>
            <View style={styles.annualGrid}>
              <StatCell label="km totales" value={annualStats.totalKm.toFixed(0)} />
              <StatCell label="actividades" value={String(annualStats.totalRuns)} />
              <StatCell label="días activos" value={String(annualStats.activeDays)} />
              <StatCell label="km/semana avg" value={annualStats.avgWeeklyKm.toFixed(1)} />
            </View>
          </Card>
        )}

        {/* Personal records */}
        <Card>
          <Text style={styles.sectionTitle}>Récords personales</Text>
          {recordsQuery.isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {records?.map((rec) =>
                rec ? (
                  <View key={rec.distance} style={styles.prRow}>
                    <View>
                      <Text style={styles.prDist}>{rec.distance}</Text>
                      <Text style={styles.prDate}>{new Date(rec.date).toLocaleDateString("es")}</Text>
                    </View>
                    <View style={styles.prRight}>
                      <Text style={styles.prTime}>{rec.timeFormatted}</Text>
                      <Text style={styles.prPace}>{rec.pace}</Text>
                    </View>
                  </View>
                ) : null,
              )}
              {longestRun && (
                <View style={styles.prRow}>
                  <View>
                    <Text style={styles.prDist}>Carrera más larga</Text>
                    <Text style={styles.prDate}>
                      {new Date(longestRun.date).toLocaleDateString("es")}
                    </Text>
                  </View>
                  <Text style={styles.prTime}>{longestRun.km.toFixed(1)} km</Text>
                </View>
              )}
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  annualGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCell: {
    width: "45%",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
  },
  statValue: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  prDist: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  prDate: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  prRight: { alignItems: "flex-end" },
  prTime: { fontSize: 16, fontWeight: "700", color: COLORS.accent },
  prPace: { fontSize: 11, color: COLORS.textMuted },
});
