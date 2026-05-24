import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { COLORS } from "@/lib/constants";
import type { DailyRecommendation } from "@/hooks/useCoachDaily";

interface DailyCoachCardProps {
  data: DailyRecommendation | undefined;
  isLoading: boolean;
  compact?: boolean;
}

export function DailyCoachCard({ data, isLoading, compact = false }: DailyCoachCardProps) {
  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner message="Consultando coach…" />
      </Card>
    );
  }

  if (!data) return null;

  const isTrain = data.recommendation === "train";

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>HOY</Text>
        <Badge
          label={isTrain ? "Entrenar" : "Descansar"}
          variant={isTrain ? "train" : "rest"}
        />
      </View>

      <Text style={styles.title}>{data.title}</Text>

      {!compact && (
        <>
          <Text style={styles.body}>{data.body}</Text>

          {isTrain && (data.duration ?? data.intensity) && (
            <View style={styles.targets}>
              {data.duration && (
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Duración</Text>
                  <Text style={styles.targetValue}>{data.duration}</Text>
                </View>
              )}
              {data.intensity && (
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Intensidad</Text>
                  <Text style={styles.targetValue}>{data.intensity}</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    letterSpacing: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  targets: {
    marginTop: 12,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  targetLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  targetValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
});
