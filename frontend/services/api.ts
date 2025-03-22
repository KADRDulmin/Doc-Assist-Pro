/**
 * Base API configuration and utilities
 */
import { Platform } from 'react-native';
import { tokenService } from '@/services/tokenService';
import Constants from 'expo-constants';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get the appropriate API URL based on environment and platform
 * This function is critical for container compatibility
 */
const getApiUrl = () => {
  // Container environment with env variables takes precedence
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Expo config extra also takes precedence if available
  if (Constants.expoConfig?.extra?.apiUrl) {
    console.log('Using Expo config API URL:', Constants.expoConfig.extra.apiUrl);
    return Constants.expoConfig.extra.apiUrl;
  }

  // Development environment settings
  if (__DEV__) {
    if (Platform.OS === 'web') {
      // For web development, use the same origin if in browser
      if (isBrowser) {
        // Parse current window origin to get the host
        const origin = window.location.origin;
        const apiUrl = origin.includes('localhost:19') 
          ? 'http://localhost:3000' 
          : origin.replace(/:\d+$/, ':3000');
        
        console.log('Web development API URL:', apiUrl);
        return apiUrl;
      }
      // Fallback for server-side rendering on web
      return 'http://localhost:3000';
    } else if (Platform.OS === 'android') {
      // Android emulator needs special IP for localhost
      return 'http://10.0.2.2:3000';
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:3000';
    }
  }
  
  // Production fallback URL
  return 'https://api.your-production-domain.com';
};

// Determine API URL once and cache it
export const API_URL = getApiUrl();

// Only log in client environments
if (isBrowser || Platform.OS !== 'web') {
  console.log('API URL configured as:', API_URL);
  console.log('Running on platform:', Platform.OS);
  console.log('Development mode:', __DEV__ ? 'Yes' : 'No');
}

// HTTP request methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

// Common headers
export const getHeaders = async (includeAuth = false) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If authentication is required, add the token from storage
  if (includeAuth) {
    const token = await tokenService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request function with better error handling
export const apiRequest = async <T>(
  endpoint: string,
  method: string = HTTP_METHODS.GET,
  data?: any,
  requiresAuth: boolean = false
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  
  console.log(`Making ${method} request to: ${url}`);
  
  const options: RequestInit = {
    method,
    headers: await getHeaders(requiresAuth),
  };

  if (data && (method === HTTP_METHODS.POST || method === HTTP_METHODS.PUT)) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    // Log response details for debugging
    console.log(`Response status: ${response.status}`);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      console.log('Non-JSON response:', text);
      responseData = { message: text };
    }

    if (!response.ok) {
      throw new Error(responseData.error || `Request failed with status ${response.status}`);
    }

    return responseData;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    
    // More specific error messages for network issues
    if (error instanceof TypeError && error.message.includes('Network')) {
      throw new Error(`Network error: Check if the server is running and accessible. Original error: ${error.message}`);
    }
    
    throw error;
  }
};
