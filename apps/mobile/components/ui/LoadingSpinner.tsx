import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { COLORS } from "@/lib/constants";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen = false }: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  message: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
