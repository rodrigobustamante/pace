import { useEffect } from "react";
import { Redirect } from "expo-router";
import { isAuthenticated } from "@/lib/auth";
import { useState } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    isAuthenticated().then(setAuthed);
  }, []);

  if (authed === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#060d1a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#f97316" />
      </View>
    );
  }

  return <Redirect href={authed ? "/(tabs)" : "/(auth)"} />;
}
