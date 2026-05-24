import { ScrollView, View, Text, RefreshControl, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMetrics } from "@/hooks/useMetrics";
import { useCoachDaily } from "@/hooks/useCoachDaily";
import { useRisk } from "@/hooks/useRisk";
import { useAuthStore } from "@/store/auth";
import { KPITile } from "@/components/ui/KPITile";
import { Card } from "@/components/ui/Card";
import { DailyCoachCard } from "@/components/DailyCoachCard";
import { RiskCard } from "@/components/RiskCard";
import { COLORS } from "@/lib/constants";

function tsbColor(tsb: number) {
  if (tsb > 5) return COLORS.green;
  if (tsb > -10) return COLORS.text;
  if (tsb > -20) return COLORS.amber;
  return COLORS.red;
}

export default function OverviewScreen() {
  const metricsQuery = useMetrics();
  const dailyQuery = useCoachDaily();
  const riskQuery = useRisk();

  const isRefreshing =
    metricsQuery.isFetching || dailyQuery.isFetching || riskQuery.isFetching;

  function onRefresh() {
    void metricsQuery.refetch();
    void dailyQuery.refetch();
    void riskQuery.refetch();
  }

  const fitness = metricsQuery.data?.fitness ?? [];
  const latest = fitness[fitness.length - 1];
  const weeklyData = metricsQuery.data?.weeklyData ?? [];
  const lastWeek = weeklyData[weeklyData.length - 1];

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>PACE</Text>
            <Text style={styles.subtitle}>Panel de entrenamiento</Text>
          </View>
        </View>

        {/* This week KPIs */}
        <Card>
          <Text style={styles.sectionLabel}>ESTA SEMANA</Text>
          <View style={styles.kpiRow}>
            <KPITile
              label="Kilómetros"
              value={lastWeek ? lastWeek.km.toFixed(1) : "—"}
              unit="km"
              color={COLORS.accent}
            />
            <KPITile
              label="Sesiones"
              value={lastWeek?.sessions ?? "—"}
            />
            <KPITile
              label="TSS"
              value={lastWeek?.tss ?? "—"}
            />
          </View>
        </Card>

        {/* CTL / ATL / TSB */}
        <Card>
          <Text style={styles.sectionLabel}>FORMA ACTUAL</Text>
          <View style={styles.kpiRow}>
            <KPITile
              label="CTL"
              value={latest ? Math.round(latest.ctl) : "—"}
              color={COLORS.blue}
            />
            <KPITile
              label="ATL"
              value={latest ? Math.round(latest.atl) : "—"}
              color={COLORS.amber}
            />
            <KPITile
              label="TSB"
              value={latest ? Math.round(latest.tsb) : "—"}
              color={latest ? tsbColor(latest.tsb) : COLORS.text}
            />
          </View>
          {latest && (
            <Text style={styles.tsbHint}>
              {latest.tsb > 5
                ? "✅ Fresco — listo para rendir"
                : latest.tsb > -10
                ? "🟡 En carga — fatiga moderada"
                : latest.tsb > -20
                ? "🟠 Fatigado — monitorea la carga"
                : "🔴 Sobrecargado — prioriza recuperación"}
            </Text>
          )}
        </Card>

        {/* Daily coach */}
        <DailyCoachCard
          data={dailyQuery.data}
          isLoading={dailyQuery.isLoading}
          compact
        />

        {/* Risk card (only visible when warning/danger) */}
        <RiskCard data={riskQuery.data} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
  },
  tsbHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    textAlign: "center",
  },
});
