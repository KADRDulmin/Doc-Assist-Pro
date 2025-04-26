import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  ActivityIndicator, 
  SafeAreaView, 
  Platform,
  TouchableOpacity 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import geminiService, { HealthTipContent } from '@/src/services/gemini.service';

export default function HealthTipDetailScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ id: string; title: string; category: string }>();
  const { id, title, category } = params;

  const [tipContent, setTipContent] = useState<HealthTipContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (title && category) {
      loadTipContent();
    } else {
      setError('Missing health tip information.');
      setLoading(false);
    }
  }, [id, title, category]);

  const loadTipContent = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Generating content for: ${title} (${category})`);
      const response = await geminiService.generateHealthTipContent(title!, category!);
      if (response.success && response.data) {
        setTipContent(response.data);
      } else {
        setError(response.message || 'Failed to load health tip content.');
      }
    } catch (err: any) {
      console.error('Error loading health tip content:', err);
      setError(err?.message || 'An error occurred while loading the health tip.');
    } finally {
      setLoading(false);
    }
  };

  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Generating health tip article...</ThemedText>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadTipContent}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Content state
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colorScheme === 'dark' ? headerGradientDark : headerGradientLight}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {tipContent?.title || 'Health Tip'}
          </ThemedText>
          {/* Optional: Add a share or bookmark icon here */}
          <View style={{ width: 24 }} /> 
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.contentCard}>
          <View style={styles.categoryContainer}>
            <Ionicons name="pricetag" size={14} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.categoryText}>{tipContent?.category || 'General'}</ThemedText>
          </View>
          
          <ThemedText style={styles.articleContent}>
            {tipContent?.content}
          </ThemedText>
          
          <View style={styles.sourceContainer}>
            <ThemedText style={styles.sourceText}>
              Source: {tipContent?.source || 'Doc-Assist-Pro AI'}
            </ThemedText>
            <ThemedText style={styles.sourceText}>
              Generated on: {tipContent ? new Date(tipContent.created_at).toLocaleDateString() : ''}
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#e53935',
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  backButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40, // Adjust for status bar
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backIcon: {
    padding: 5, // Add padding for easier tapping
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1, // Allow title to take available space
    marginHorizontal: 10, // Add space around title
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  contentCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.tint + '1A', // Light tint background
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.tint, // Use tint color
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify', // Justify text for better readability
  },
  sourceContainer: {
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 15,
  },
  sourceText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 5,
  },
});
