import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define supported platforms for better type safety
type SupportedPlatform = 'ios' | 'android' | 'web';

// Configuration for different environments and platforms
const API_CONFIG: {
  [env: string]: {
    [platform in SupportedPlatform]: string;
  };
} = {
  // For development environment
  development: {
    // For Android emulator, 10.0.2.2 points to host's localhost
    android: 'http://10.0.2.2:3000/api',
    // For iOS simulator, localhost works
    ios: 'http://192.168.1.4:3000/api',
    // ios: 'http://localhost:3000/api',
    // For web
    web: 'http://192.168.1.4:3000/api',
    // web: 'http://localhost:3000/api',
  },
  // For production environment (when deploying to real devices)
  production: {
    android: 'https://your-production-api.com/api',
    ios: 'https://your-production-api.com/api',
    web: 'https://your-production-api.com/api',
  },
  // For testing with physical devices on local network
  local_network: {
    // Replace with your actual machine's IP
    android: 'http://192.168.1.4:3000/api',
    ios: 'http://192.168.1.4:3000/api',
    web: 'http://192.168.1.4:3000/api',
  }
};

// Environment settings
const ENV = __DEV__ ? 'development' : 'production';
// Set this to true when testing with physical devices
const USE_LOCAL_NETWORK = false;

// Get the appropriate API URL based on platform and environment
export const getApiBaseUrl = (): string => {
  // Get current platform
  const platform = Platform.OS;
  
  // Determine which configuration to use
  const config = USE_LOCAL_NETWORK ? API_CONFIG.local_network : API_CONFIG[ENV];
  
  // Map all possible Platform.OS values to our supported platforms
  let mappedPlatform: SupportedPlatform;
  
  if (platform === 'ios' || platform === 'android') {
    // These platforms are directly supported
    mappedPlatform = platform;
  } else if (platform === 'web') {
    // Web is directly supported
    mappedPlatform = 'web';
  } else {
    // For other platforms (windows, macos), default to web configuration
    mappedPlatform = 'web';
  }
  
  return config[mappedPlatform];
};

// Ensure we're using the correct API URL
// For local development, this should point to your backend server
export const API_BASE_URL = 'http://192.168.1.4:3000';
// export const API_BASE_URL = 'http://localhost:3000';
export const API_PREFIX = '/api';

/**
 * Enhanced fetch wrapper for API requests
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  try {
    console.log(`Making API request to: ${API_BASE_URL}${API_PREFIX}${endpoint}`);
    
    // Log request body (sanitized) for debugging
    if (options.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        console.log('Request body:', {
          ...bodyObj,
          password: bodyObj.password ? '[REDACTED]' : undefined
        });
      } catch (e) {
        // Not JSON body or can't be parsed
      }
    }
    
    // Get the token if available
    const token = await AsyncStorage.getItem('userToken');
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    
    // Make the request
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
      ...options,
      headers,
    });
    
    // Get response as text first for debugging
    const responseText = await response.text();
    console.log(`API response status: ${response.status}`);
    console.log(`API response text (preview): ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
    
    // Parse JSON after logging
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response as JSON:', e);
      throw new Error('Invalid JSON response from server');
    }
    
    // Handle error responses
    if (!response.ok) {
      console.error('API error response:', data);
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API request failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};
