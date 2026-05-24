import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/constants";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focused,
}: {
  name: IoniconsName;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={24}
      color={focused ? COLORS.accent : COLORS.textDim}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: { fontSize: 11, marginTop: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Actividades",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "list" : "list-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          title: "Métricas",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "stats-chart" : "stats-chart-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
