import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePalette } from '@/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const p = usePalette();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: p.bgElevated },
            headerTintColor: p.text,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: p.bg },
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scenarios" options={{ title: 'Scénarios' }} />
          <Stack.Screen name="comparaison" options={{ title: 'Comparaison' }} />
          <Stack.Screen name="parametres" options={{ title: 'Paramètres' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
