import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL, API_PREFIX } from '@/config/api';

export default function NetworkInfo() {
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the app configuration
  const manifestExtra = Constants.expoConfig?.extra || {};
  const ipAddress = manifestExtra.devServerIp || 'Not set';

  // Test API connection
  const testApiConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health`);
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testApiConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Information</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Current API URL:</Text>
        <Text style={styles.value}>{API_BASE_URL}{API_PREFIX}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Development IP:</Text>
        <Text style={styles.value}>{ipAddress}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Platform:</Text>
        <Text style={styles.value}>{Platform.OS}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Is Development:</Text>
        <Text style={styles.value}>{__DEV__ ? 'Yes' : 'No'}</Text>
      </View>
      
      <Text style={styles.sectionTitle}>API Health Check:</Text>
      <View style={styles.apiResponseContainer}>
        {isLoading ? (
          <Text>Loading...</Text>
        ) : (
          <Text style={styles.apiResponse}>{apiResponse}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
    flex: 1,
  },
  value: {
    flex: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  apiResponseContainer: {
    backgroundColor: '#e8e8e8',
    padding: 10,
    borderRadius: 4,
  },
  apiResponse: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
});
