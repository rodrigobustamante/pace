import { Stack } from "expo-router";
import { COLORS } from "@/lib/constants";

export default function CoachLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    />
  );
}
