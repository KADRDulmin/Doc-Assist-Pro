// Import polyfills first
import '../utils/polyfills';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

import { useColorScheme } from '../hooks/useColorScheme';
import { AuthProvider } from '../contexts/AuthContext';
import Colors from '../constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const deviceColorScheme = useDeviceColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Create custom themes for Paper provider with our color scheme
  const paperTheme = 
    colorScheme === 'dark'
      ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: Colors.dark.primary } }
      : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: Colors.light.primary } };

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
