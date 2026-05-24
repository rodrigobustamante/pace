import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { COLORS } from "@/lib/constants";
import type { WeeklyPoint } from "@/hooks/useMetrics";

interface WeeklyBarChartProps {
  weeklyData: WeeklyPoint[];
  weeks?: number;
}

export function WeeklyBarChart({ weeklyData, weeks = 12 }: WeeklyBarChartProps) {
  const slice = weeklyData.slice(-weeks);

  if (slice.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sin datos suficientes</Text>
      </View>
    );
  }

  const data = slice.map((w) => ({
    value: parseFloat(w.km.toFixed(1)),
    frontColor: COLORS.accent,
    label: new Date(w.week).toLocaleDateString("es", { day: "numeric", month: "short" }),
  }));

  const width = Dimensions.get("window").width - 64;

  return (
    <BarChart
      data={data}
      width={width}
      height={130}
      barWidth={Math.max(8, Math.floor(width / slice.length) - 6)}
      spacing={6}
      backgroundColor={COLORS.surface}
      xAxisColor={COLORS.border}
      yAxisColor={COLORS.border}
      yAxisTextStyle={{ color: COLORS.textDim, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: COLORS.textDim, fontSize: 9 }}
      noOfSections={3}
      rulesColor={COLORS.border}
      initialSpacing={4}
      endSpacing={4}
      hideRules={false}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 130,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 13,
  },
});
