import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { usePalette } from '@/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const p = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: p.bgElevated },
        headerTintColor: p.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: { backgroundColor: p.bgElevated, borderTopColor: p.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'ImmoSim', tabBarLabel: 'Accueil', tabBarIcon: ({ focused }) => <TabIcon emoji="🏡" focused={focused} /> }}
      />
      <Tabs.Screen
        name="emprunt"
        options={{ title: "Capacité d'emprunt", tabBarLabel: 'Emprunt', tabBarIcon: ({ focused }) => <TabIcon emoji="🏦" focused={focused} /> }}
      />
      <Tabs.Screen
        name="reste-a-vivre"
        options={{ title: 'Reste à vivre', tabBarLabel: 'Budget', tabBarIcon: ({ focused }) => <TabIcon emoji="💶" focused={focused} /> }}
      />
      <Tabs.Screen
        name="fiscalite"
        options={{ title: 'Fiscalité', tabBarLabel: 'Fiscalité', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
      <Tabs.Screen
        name="patrimoine"
        options={{ title: 'Patrimoine', tabBarLabel: 'Patrimoine', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
    </Tabs>
  );
}
