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
 * Standard API response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
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

class BaseApiService {
  protected baseUrl: string = API_URL;
  protected endpoint: string;
  
  constructor(endpoint: string = '') {
    this.endpoint = endpoint;
  }

  /**
   * Get common headers for API requests
   * @param includeAuth - Whether to include authentication token
   */
  protected async getHeaders(includeAuth = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (includeAuth) {
      // More robust token retrieval
      try {
        const token = await tokenService.getToken();
        
        if (token) {
          // Ensure the token is properly formatted with 'Bearer ' prefix
          headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          console.log('Added auth token to request headers');
        } else {
          console.warn('Authentication required but no token found - request may fail');
        }
      } catch (error) {
        console.error('Error retrieving token for request headers:', error);
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
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`Making ${method} request to: ${url}`);
    
    // If authentication is required, verify token before proceeding
    if (requiresAuth) {
      const token = await tokenService.getToken();
      if (!token) {
        console.error(`Authentication required for ${endpoint} but no token available`);
        throw new Error('Authentication required. Please login.');
      }
    }
    
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
      
      // Check for token refresh header
      if (requiresAuth && response.headers.has('X-New-Token')) {
        const newToken = response.headers.get('X-New-Token');
        if (newToken) {
          console.log('Received new token from server, updating local storage');
          await tokenService.storeToken(newToken);
        }
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
        
        // For 500 Internal Server Error, provide a structured response anyway
        if (response.status === 500) {
          responseData = { 
            success: false, 
            message: 'Internal server error', 
            error: text || 'An unexpected error occurred on the server'
          };
        } else {
          responseData = { message: text };
        }
      }
      
      // Handle unauthorized (401) and forbidden (403) responses that indicate auth issues
      if ((response.status === 401 || response.status === 403) && requiresAuth) {
        const errorMessage = responseData.error || responseData.message || '';
        
        // Check if we should try token refresh for 401 unauthorized
        if (response.status === 401) {
          const shouldTryRefresh = errorMessage.includes('Token expired') || 
            errorMessage.includes('invalid token') ||
            errorMessage.includes('jwt');
            
          if (shouldTryRefresh) {
            console.log('Token appears expired, attempting to refresh');
            
            try {
              const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  token: await tokenService.getToken()
                })
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.token) {
                  // Save new token
                  await tokenService.storeToken(refreshData.token);
                  
                  // Retry original request with new token
                  console.log('Token refreshed successfully, retrying original request');
                  options.headers = await this.getHeaders(requiresAuth);
                  const retryResponse = await fetch(url, options);
                  
                  // Handle retry response
                  if (retryResponse.ok) {
                    if (retryResponse.headers.get('content-type')?.includes('application/json')) {
                      return await retryResponse.json();
                    } else {
                      const text = await retryResponse.text();
                      return { message: text } as unknown as T;
                    }
                  }
                }
              } else {
                // If refresh failed, clear token and trigger automatic logout
                console.log('Token refresh failed, clearing invalid token');
                await tokenService.clearToken();
                this.triggerAutomaticLogout('Session expired. Please log in again.');
              }
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
              this.triggerAutomaticLogout('Authentication error. Please log in again.');
            }
          } else {
            // If there was no indication this was a token expiry issue, clear token
            console.log('Authentication failed with 401 but no token expiry message, clearing token');
            await tokenService.clearToken();
            this.triggerAutomaticLogout('Authentication required. Please log in again.');
          }
        }
        
        // For 403 Forbidden responses related to authentication/authorization
        if (response.status === 403) {
          console.log('Authentication failed with 403:', errorMessage);
          
          // Check if the error is related to permissions or authorization
          const isAuthError = 
            errorMessage.includes('access required') || 
            errorMessage.includes('not authorized') || 
            errorMessage.includes('permission') ||
            errorMessage.includes('forbidden');
            
          if (isAuthError) {
            // Clear token and trigger automatic logout for auth-related 403 errors
            await tokenService.clearToken();
            this.triggerAutomaticLogout('Your session has expired or you don\'t have permission for this action. Please log in again.');
            throw new Error(errorMessage || 'Access denied. Please log in again.');
          }
        }
      }

      // Enhanced error handling for non-200 responses
      if (!response.ok) {
        // For 500 errors, add more structured error data
        if (response.status === 500) {
          console.error('Server returned 500 Internal Server Error:', responseData.error || responseData.message);
          
          // Throw structured error object - this will be caught by the catch block
          throw new Error(responseData.error || responseData.message || 'Internal server error');
        }
        
        // For other errors, use the error message from the response if available
        const errorMessage = (responseData.error || responseData.message || `Request failed with status ${response.status}`);
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Improve CORS error handling
      if (error instanceof TypeError && error.message.includes('Network')) {
        console.error('This appears to be a CORS or network issue. Check backend CORS configuration.');
      }
      
      throw error;
    }
  }
  
  /**
   * Trigger automatic logout and redirect to login screen when token is invalid
   * This uses a custom event to communicate with the auth context
   */
  private triggerAutomaticLogout(message: string): void {
    console.log('Triggering automatic logout due to auth error:', message);
    
    // Use a global event to communicate with AuthContext from any service
    if (typeof window !== 'undefined') {
      // For web environment
      const logoutEvent = new CustomEvent('auth:forcedLogout', { 
        detail: { message } 
      });
      window.dispatchEvent(logoutEvent);
    } else {
      // For React Native environment, we'll use a global event emitter
      // This will be listened to by the AuthContext
      if (global.authEventEmitter) {
        global.authEventEmitter.emit('forcedLogout', { message });
      } else {
        console.error('Auth event emitter not found, cannot trigger automatic logout');
      }
    }
  }

  /**
   * Make a GET request
   */
  protected async get<T>(path: string = '', requiresAuth: boolean = true): Promise<T> {
    const endpoint = this.endpoint + path;
    return this.request<T>(endpoint, HttpMethod.GET, undefined, requiresAuth);
  }

  /**
   * Make a POST request
   */
  protected async post<T>(path: string = '', data: any, requiresAuth: boolean = true): Promise<T> {
    const endpoint = this.endpoint + path;
    return this.request<T>(endpoint, HttpMethod.POST, data, requiresAuth);
  }

  /**
   * Make a PUT request
   */
  protected async put<T>(path: string = '', data?: any, requiresAuth: boolean = true): Promise<T> {
    const endpoint = this.endpoint + path;
    return this.request<T>(endpoint, HttpMethod.PUT, data, requiresAuth);
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T>(path: string = '', requiresAuth: boolean = true): Promise<T> {
    const endpoint = this.endpoint + path;
    return this.request<T>(endpoint, HttpMethod.DELETE, undefined, requiresAuth);
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T>(path: string = '', data: any, requiresAuth: boolean = true): Promise<T> {
    const endpoint = this.endpoint + path;
    return this.request<T>(endpoint, HttpMethod.PATCH, data, requiresAuth);
  }
}

export default BaseApiService;
