/**
 * Base API Service
 * Provides core functionality for API communication
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { tokenService } from '../token.service';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// HTTP request methods enum
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

/**
 * Get the appropriate API URL based on environment and platform
 */
const getApiUrl = (): string => {
  // Container environment with env variables takes precedence
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // For Docker environment, always use the host machine's IP
  if (Platform.OS === 'web' && isBrowser && window.location.hostname === 'localhost') {
    console.log('Running in Docker environment, using fixed API URL');
    return 'http://localhost:3000';
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

// Initialize the API URL once
export const API_URL = getApiUrl();

// Only log in client environments
if (isBrowser || Platform.OS !== 'web') {
  console.log('API URL configured as:', API_URL);
  console.log('Running on platform:', Platform.OS);
  console.log('Development mode:', __DEV__ ? 'Yes' : 'No');
}

export class BaseApiService {
  protected baseUrl: string = API_URL;
  
  /**
   * Get common headers for API requests
   * @param includeAuth - Whether to include authentication token
   */
  protected async getHeaders(includeAuth = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (includeAuth) {
      const token = await tokenService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Make an API request with proper error handling
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param data - Request payload
   * @param requiresAuth - Whether authentication is required
   */
  protected async request<T>(
    endpoint: string,
    method: HttpMethod = HttpMethod.GET,
    data?: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`Making ${method} request to: ${url}`);
    
    const options: RequestInit = {
      method,
      headers: await this.getHeaders(requiresAuth),
      mode: 'cors',
      credentials: requiresAuth ? 'include' : 'same-origin',
    };

    if (data && (method !== HttpMethod.GET)) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      // Log response details for debugging in development
      if (__DEV__) {
        console.log(`Response status: ${response.status}`);
      }
      
      // Handle response content based on Content-Type
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        if (__DEV__) {
          console.log('Non-JSON response:', text);
        }
        responseData = { message: text };
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Request failed with status ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Improve CORS error handling
      if (error instanceof TypeError && error.message.includes('Network')) {
        console.error('This appears to be a CORS or network issue. Check backend CORS configuration.');
        throw new Error(`CORS or Network error: Check if the server is running and CORS is properly configured. Original error: ${error.message}`);
      }
      
      throw error;
    }
  }
}
