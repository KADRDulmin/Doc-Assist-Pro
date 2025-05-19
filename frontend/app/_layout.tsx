import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import ErrorBoundary from '@/src/components/ErrorBoundary';
import { useColorScheme } from '@/hooks/useColorScheme';
import NotificationService from '@/src/services/notification.service';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize notifications
  useEffect(() => {
    async function initializeNotifications() {
      try {
        const token = await NotificationService.registerForPushNotifications();
        if (token) {
          console.log('Notification token:', token);
          // You can send this token to your backend to save it for the user
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    }

    initializeNotifications();
  }, []);

  // Handle notification response when app is in foreground
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      if (data?.url) {
        // Navigate to the appropriate screen based on the notification data
        router.push(data.url);
      }
    });

    return () => subscription.remove();
  }, []);

  // Log environment variables for debugging
  useEffect(() => {
    console.log('Environment variables:');
    console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    console.log('REACT_NATIVE_PACKAGER_HOSTNAME:', process.env.REACT_NATIVE_PACKAGER_HOSTNAME);
    console.log('Platform:', Platform.OS);
  }, []);
  
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: true, title: "Edit Profile" }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
