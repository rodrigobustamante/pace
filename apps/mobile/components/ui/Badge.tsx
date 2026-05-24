import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/lib/constants";

type BadgeVariant = "train" | "rest" | "warning" | "danger" | "ok" | "default";

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  train: { bg: "rgba(74,222,128,0.15)", text: COLORS.green },
  rest: { bg: "rgba(96,165,250,0.15)", text: COLORS.blue },
  warning: { bg: "rgba(251,191,36,0.15)", text: COLORS.amber },
  danger: { bg: "rgba(248,113,113,0.15)", text: COLORS.red },
  ok: { bg: "rgba(74,222,128,0.15)", text: COLORS.green },
  default: { bg: "rgba(148,163,184,0.15)", text: COLORS.textMuted },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
