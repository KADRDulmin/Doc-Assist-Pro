import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  ActivityIndicator, 
  SafeAreaView,
  Platform,
  TouchableOpacity,
  useWindowDimensions 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import geminiService, { HealthTipContent } from '@/src/services/gemini.service';

export default function HealthTipDetailScreen() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; title: string; category: string }>();
  const { id, title, category } = params;

  const [tipContent, setTipContent] = useState<HealthTipContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isDarkMode = colorScheme === 'dark';

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

  // Markdown styling based on theme
  const markdownStyles = StyleSheet.create({
    // Base styles
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? '#E0E0E0' : '#333333',
    },
    // Headings
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 12,
      color: isDarkMode ? '#A1CEDC' : '#0a7ea4',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(161, 206, 220, 0.3)' : 'rgba(10, 126, 164, 0.2)',
      paddingBottom: 8,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: isDarkMode ? '#A1CEDC' : '#0a7ea4',
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 8,
      color: isDarkMode ? '#8FB8C9' : '#2980b9',
    },
    // Paragraphs
    paragraph: {
      marginBottom: 16,
      fontSize: 16,
      lineHeight: 24,
    },
    // Lists
    bullet_list: {
      marginBottom: 16,
    },
    ordered_list: {
      marginBottom: 16,
    },
    list_item: {
      marginBottom: 8,
      flexDirection: 'row' as const,
    },
    // Emphasis
    strong: {
      fontWeight: 'bold',
    },
    em: {
      fontStyle: 'italic',
    },
    // Links
    link: {
      color: '#2980b9',
      textDecorationLine: 'underline',
    },
    // Blockquote
    blockquote: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderLeftWidth: 3,
      borderLeftColor: isDarkMode ? '#A1CEDC' : '#0a7ea4',
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 12,
      marginLeft: 0,
      marginRight: 0,
    },
    // Code blocks
    code_inline: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      backgroundColor: isDarkMode ? '#2c3e50' : '#f5f5f5',
      color: isDarkMode ? '#e74c3c' : '#e74c3c',
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    code_block: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      backgroundColor: isDarkMode ? '#2c3e50' : '#f5f5f5',
      padding: 12,
      borderRadius: 8,
      marginVertical: 12,
    },
    fence: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      backgroundColor: isDarkMode ? '#2c3e50' : '#f5f5f5',
      padding: 12,
      borderRadius: 8,
      marginVertical: 12,
    },
    // Tables
    table: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#4a6572' : '#ddd',
      borderRadius: 8,
      marginVertical: 16,
    },
    thead: {
      backgroundColor: isDarkMode ? '#1D3D47' : '#f9f9f9',
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: isDarkMode ? '#4a6572' : '#eee',
    },
    th: {
      padding: 10,
      fontWeight: 'bold',
    },
    td: {
      padding: 10,
    },
  });

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
          <ThemedText style={styles.loadingText}>Generating personalized health article...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#e53935" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadTipContent}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Content state
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? headerGradientDark : headerGradientLight}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {tipContent?.title || title || 'Health Tip'}
          </ThemedText>
          <View style={{ width: 24 }} /> 
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.contentCard}>
          <View style={styles.categoryContainer}>
            <Ionicons 
              name="pricetag" 
              size={14} 
              color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} 
            />
            <ThemedText style={styles.categoryText}>
              {tipContent?.category || category || 'General'}
            </ThemedText>
          </View>
          
          {/* Markdown content */}
          <Markdown style={markdownStyles}>
            {tipContent?.content || ''}
          </Markdown>
          
          <View style={styles.sourceContainer}>
            <ThemedText style={styles.sourceText}>
              Source: {tipContent?.source || 'Doc-Assist-Pro AI'}
            </ThemedText>
            <ThemedText style={styles.sourceText}>
              Generated on: {tipContent ? new Date(tipContent.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
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
    paddingTop: 30,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 150,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    minWidth: 150,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backIcon: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  contentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#0a7ea4',
  },
  sourceContainer: {
    marginTop: 30,
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