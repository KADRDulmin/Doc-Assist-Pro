import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import the API_URL from base-api.service
import { API_URL } from '@/src/services/api/base-api.service';

export default function ImageViewerScreen() {
  const params = useLocalSearchParams();
  const imageUrl = decodeURIComponent(params.url as string || '');
  const title = params.title as string || 'Image';
  
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Get full image URL if it's a relative path
  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    
    // Ensure the URL starts with a slash if needed
    const formattedPath = url.startsWith('/') ? url : `/${url}`;
    return `${API_URL}${formattedPath}`;
  };
  
  const fullImageUrl = getFullImageUrl(imageUrl);
  
  // Add debugging effect to log URL information
  useEffect(() => {
    console.log('Image component rendered with URL:', imageUrl);
    console.log('Full image URL:', fullImageUrl);
    console.log('API_URL used:', API_URL);
    
    // Test fetch to verify if the URL is accessible
    const testImageAccess = async () => {
      try {
        const response = await fetch(fullImageUrl, { method: 'HEAD' });
        console.log('Image HEAD request status:', response.status);
        if (!response.ok) {
          setDebugInfo(`Image URL returned status: ${response.status}`);
        }
      } catch (err) {
        console.error('Error testing image URL:', err);
        setDebugInfo(`Error accessing URL: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    testImageAccess();
  }, [fullImageUrl, imageUrl]);
  
  const handleImageLoad = () => {
    console.log('Image loaded successfully:', fullImageUrl);
    setLoading(false);
  };
  
  const handleImageError = (error: any) => {
    console.error('Image load error:', error);
    setLoading(false);
    setError('Failed to load image. Please check if the file exists on the server.');
  };
  
  const handleShareImage = async () => {
    try {
      if (Platform.OS === 'web') {
        alert('Sharing is not available on web');
        return;
      }
      
      // Simplified sharing that doesn't require downloading with FileSystem
      await Share.share({
        url: fullImageUrl,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      alert('Failed to share image');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: title,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <View style={styles.imageContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.loadingText}>Loading image...</ThemedText>
          </View>
        )}
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={50} color="#e53935" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : (
          <Image
            source={{ uri: fullImageUrl }}
            style={styles.image}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </View>
      
      {!error && !loading && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareImage}
          >
            <Ionicons name="share-outline" size={24} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.actionText}>Share</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});