import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import NetworkInfo from '@/components/NetworkInfo';
import { API_BASE_URL, API_PREFIX } from '@/config/api';

export default function NetworkDebugScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Network Debug' }} />
      
      <Text style={styles.heading}>Network Debug</Text>
      <Text style={styles.description}>
        This screen helps diagnose connection issues with the backend server.
      </Text>
      
      <NetworkInfo />
      
      <View style={styles.tipContainer}>
        <Text style={styles.tipHeading}>Troubleshooting Tips:</Text>
        <Text style={styles.tip}>1. Ensure your backend is running at {API_BASE_URL}</Text>
        <Text style={styles.tip}>2. Verify your device is on the same network as your computer</Text>
        <Text style={styles.tip}>3. Check CORS settings in your backend to allow connections</Text>
        <Text style={styles.tip}>4. Try restarting the Expo development server</Text>
        <Text style={styles.tip}>5. Run 'npm run set-dev-ip' to update your IP address</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  tipContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  tipHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    marginBottom: 6,
  },
});
