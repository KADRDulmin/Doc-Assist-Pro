import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth token key
export const AUTH_TOKEN_KEY = 'doctor_auth_token';

// Get the API URL from environment or use a default that works on both emulators and devices
const getApiBaseUrl = () => {
  // Check if running in Expo development
  if (__DEV__) {
    // First, check for our custom environment variable set by start-with-device-ip.js
    // @ts-ignore - Expo constants typing may not include our custom variable
    const deviceIp = process.env.EXPO_PUBLIC_API_IP || Constants.expoConfig?.extra?.apiIp;
    
    if (deviceIp) {
      console.log(`Using device IP: ${deviceIp}`);
      return `http://${deviceIp}:3000`;
    }
    
    // For Android emulators, use 10.0.2.2 to access host machine's localhost
    // For iOS simulators, localhost actually works
    const isAndroid = Platform.OS === 'android';
    
    // Attempt to get developer machine IP from Expo constants
    let devServerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    
    if (devServerHost) {
      console.log(`Using development server IP: ${devServerHost}`);
      return `http://${devServerHost}:3000`;
    }
    
    if (isAndroid) {
      // Android emulator special case
      return 'http://10.0.2.2:3000';
    }
    
    // iOS simulator or web
    return 'http://localhost:3000';
  }
  
  // Production environment would use a real domain
  return 'https://api.docassistpro.com'; // Replace with your actual production API URL
};

// Base API URL determination
export const BASE_URL = getApiBaseUrl();
const API_BASE_URL = `${BASE_URL}/api`;
console.log(`API_BASE_URL configured as: ${API_BASE_URL}`);

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  status?: number;
}

// Function to handle unauthorized errors (401) - will be set by the AuthContext
let handleUnauthorizedError: (() => void) | null = null;

// Function to register the unauthorized error handler
export const registerUnauthorizedHandler = (handler: () => void) => {
  handleUnauthorizedError = handler;
};

// Helper function to get token from AsyncStorage
const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Generic fetch function with enhanced error handling
const fetchAPI = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    // Add a timeout to fetch requests to avoid hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Get stored token if not explicitly provided in headers
    const headers = options.headers as Record<string, string> || {};
    if (!headers['Authorization']) {
      const token = await getStoredToken();
      if (token) {
        console.log('Using stored auth token for request');
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const fetchOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal
    };
    
    // Log the request details for debugging
    if (options.body) {
      console.log('Request payload:', options.body);
    }
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    // Log response status and headers for debugging
    console.log(`API Response status: ${response.status} ${response.statusText}`);
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn('Non-JSON response:', text);
      
      // Try to parse as JSON anyway in case the content-type header is wrong
      try {
        data = JSON.parse(text);
      } catch {
        // If parsing fails, create a simple error object
        data = {
          success: false,
          error: `Server returned non-JSON response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`
        };
      }
    }
    
    // Log the response data for debugging
    console.log('API Response data:', data);
    
    if (!response.ok) {
      // Handle 401 Unauthorized errors specifically for "User not found" messages
      if (response.status === 401 && data?.error === 'User not found. Please login again.') {
        console.log('Authentication error: User not found. Logging out...');
        // Call the registered unauthorized handler if it exists
        if (handleUnauthorizedError) {
          handleUnauthorizedError();
        }
      }
      
      // Extract error message from response if available
      const errorMessage = data?.error || data?.message || `HTTP Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    return data as ApiResponse<T>;
  } catch (error: any) {
    // Provide different error messages based on the error type
    if (error.name === 'AbortError') {
      console.error(`API Request timeout: ${url}`);
      return {
        success: false,
        error: 'Request timed out. Please check your connection and try again.',
      };
    } else if (error.message === 'Network request failed') {
      console.error(`API Network error: ${url}`);
      return {
        success: false,
        error: 'Network connection error. Please check your internet connection and try again.',
      };
    } else {
      console.error(`API Error for ${url}:`, error.message);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
};

// Add authorization header to requests
export const addAuthToken = (token: string): Record<string, string> => ({
  'Authorization': `Bearer ${token}`
});

// API methods
const api = {
  BASE_URL,
  get: <T>(endpoint: string, token?: string): Promise<ApiResponse<T>> => {
    // Create headers object explicitly with type assertion
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchAPI<T>(endpoint, { headers });
  },
  
  post: <T>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> => {
    // Create headers object explicitly with type assertion
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchAPI<T>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  },
  
  put: <T>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> => {
    // Create headers object explicitly with type assertion
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchAPI<T>(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  },
  
  delete: <T>(endpoint: string, token?: string): Promise<ApiResponse<T>> => {
    // Create headers object explicitly with type assertion
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchAPI<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  },
};

export default api;