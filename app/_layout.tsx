import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import Colors from '@/constants/Colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bg,
    card: Colors.card,
    text: Colors.text,
    border: Colors.cardBorder,
    primary: Colors.accent,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/active"
          options={{ title: 'Workout', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="routine/create"
          options={{ title: 'New Routine', presentation: 'modal' }}
        />
        <Stack.Screen
          name="routine/[id]"
          options={{ title: 'Edit Routine', headerBackTitle: 'Back' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
