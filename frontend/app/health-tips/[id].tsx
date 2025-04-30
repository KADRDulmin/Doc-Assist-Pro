import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import healthTipService, { HealthTipData } from '../../src/services/healthTip.service';

/**
 * Health Tip Detail Screen
 * Displays details of a single health tip based on ID parameter
 */
export default function HealthTipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [healthTip, setHealthTip] = useState<HealthTipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function fetchHealthTip() {
      if (!id) {
        setError('No health tip ID provided');
        setLoading(false);
        return;
      }

      try {
        const tipId = parseInt(id, 10);
        const response = await healthTipService.getTipById(tipId);
        setHealthTip(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch health tip:', err);
        setError('Failed to load health tip details');
        setLoading(false);
      }
    }

    fetchHealthTip();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </SafeAreaView>
    );
  }

  if (error || !healthTip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[styles.errorText, { color: Colors[colorScheme ?? 'light'].text }]}>
          {error || 'Health tip not found'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          {healthTip.title}
        </Text>
        
        {healthTip.image_url && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: healthTip.image_url }} 
              style={styles.image} 
              resizeMode="cover"
            />
          </View>
        )}
        
        <Text style={[styles.category, { color: Colors[colorScheme ?? 'light'].tint }]}>
          {healthTip.category}
        </Text>
        
        <Text style={[styles.content, { color: Colors[colorScheme ?? 'light'].text }]}>
          {healthTip.content}
        </Text>
        
        {healthTip.source && (
          <Text style={[styles.source, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Source: {healthTip.source}
          </Text>
        )}
        
        <Text style={[styles.date, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          Published: {new Date(healthTip.created_at).toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  source: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});