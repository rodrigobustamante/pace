import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { COLORS } from "@/lib/constants";
import type { RiskResponse } from "@/hooks/useRisk";

interface RiskCardProps {
  data: RiskResponse | undefined;
}

export function RiskCard({ data }: RiskCardProps) {
  const risk = data?.overttrainingRisk;
  if (!risk || risk.level === "ok") return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>⚠️</Text>
        <Badge
          label={risk.level === "danger" ? "Riesgo alto" : "Atención"}
          variant={risk.level === "danger" ? "danger" : "warning"}
        />
      </View>
      <Text style={styles.title}>Señales de sobreentrenamiento</Text>
      {risk.signals.map((signal) => (
        <Text key={signal} style={styles.signal}>
          · {signal}
        </Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: COLORS.amber,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  signal: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
});
