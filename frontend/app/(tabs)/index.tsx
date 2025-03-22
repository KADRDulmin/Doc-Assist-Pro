import { Image, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/authService';
import { tokenService } from '@/services/tokenService';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              console.log('Logout button pressed, logging out user...');
              
              // For web platform, use direct approach
              if (Platform.OS === 'web') {
                // Force direct token clearing (bypass potential AsyncStorage issues)
                try {
                  console.log('Using web-specific logout approach');
                  // Clear token directly from both AsyncStorage and memory
                  await tokenService.clearToken();
                  
                  // Force a small delay and then navigate
                  console.log('Preparing to navigate to login screen...');
                  setTimeout(() => {
                    console.log('Navigating now...');
                    // Use router.push instead of replace for web
                    router.push('/(auth)/login');
                    
                    // Force reload as last resort if needed
                    if (typeof window !== 'undefined') {
                      setTimeout(() => {
                        if (window.location.pathname !== '/(auth)/login') {
                          console.log('Forcing page reload');
                          window.location.href = '/(auth)/login';
                        }
                      }, 300);
                    }
                  }, 200);
                } catch (e) {
                  console.error('Web-specific logout error:', e);
                  throw e;
                }
              } else {
                // Standard approach for native platforms
                await authService.logout();
                router.replace('/(auth)/login');
              }
            } catch (error) {
              console.error('Error during logout process:', error);
              Alert.alert('Logout Error', 'Failed to logout properly. Please try again.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Logout button"
          accessibilityHint="Logs you out of the application"
        >
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  logoutContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#e53935',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
