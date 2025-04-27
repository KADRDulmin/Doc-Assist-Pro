import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | null | undefined;

// Key for storing user's theme preference
const THEME_PREFERENCE_KEY = 'user-theme-preference';

export function useColorScheme(): NonNullable<ColorScheme> {
  // Get the device color scheme
  const deviceColorScheme = useDeviceColorScheme();
  // State to track user's theme preference
  const [userPreference, setUserPreference] = useState<ColorScheme | null>(null);

  // Load user preference on mount
  useEffect(() => {
    async function loadUserPreference() {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference === 'light' || savedPreference === 'dark') {
          setUserPreference(savedPreference);
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      }
    }
    
    loadUserPreference();
  }, []);

  // Function to set user theme preference
  async function setColorScheme(scheme: 'light' | 'dark') {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, scheme);
      setUserPreference(scheme);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  }

  // User preference takes priority over device scheme
  const colorScheme = userPreference || deviceColorScheme || 'light';

  // Expose the setColorScheme function as a property
  (useColorScheme as any).setColorScheme = setColorScheme;

  return colorScheme;
}
