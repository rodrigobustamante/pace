import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { COLORS } from "@/lib/constants";
import type { FitnessPoint } from "@/hooks/useMetrics";

interface FitnessChartProps {
  fitness: FitnessPoint[];
  /** How many days back to show. Default 90. */
  days?: number;
}

export function FitnessChart({ fitness, days = 90 }: FitnessChartProps) {
  const slice = fitness.slice(-days);

  if (slice.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sin datos suficientes</Text>
      </View>
    );
  }

  const ctlData = slice.map((p) => ({ value: Math.round(p.ctl) }));
  const atlData = slice.map((p) => ({ value: Math.round(p.atl) }));
  const tsbData = slice.map((p) => ({ value: Math.round(p.tsb) }));

  const width = Dimensions.get("window").width - 64; // account for card padding

  return (
    <View>
      <View style={styles.legend}>
        <LegendItem color={COLORS.blue} label="CTL (Forma)" />
        <LegendItem color={COLORS.amber} label="ATL (Fatiga)" />
        <LegendItem color={COLORS.green} label="TSB (Frescura)" />
      </View>

      <LineChart
        data={ctlData}
        data2={atlData}
        data3={tsbData}
        width={width}
        height={160}
        color1={COLORS.blue}
        color2={COLORS.amber}
        color3={COLORS.green}
        thickness={2}
        hideDataPoints
        curved
        backgroundColor={COLORS.surface}
        xAxisColor={COLORS.border}
        yAxisColor={COLORS.border}
        yAxisTextStyle={{ color: COLORS.textDim, fontSize: 10 }}
        noOfSections={4}
        rulesColor={COLORS.border}
        rulesType="solid"
        initialSpacing={0}
        endSpacing={0}
        hideXAxisText
      />
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  empty: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 13,
  },
});
