/**
 * Token service for managing authentication tokens
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

// For web, keep a memory reference as a fallback
let memoryToken: string | null = null;

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

class TokenService {
  /**
   * Store authentication token
   * @param token - JWT token to store
   */
  async storeToken(token: string): Promise<void> {
    try {
      if (!token) {
        console.warn('Attempted to store empty token');
        return;
      }
      
      // Make sure token has Bearer prefix
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Store in memory for immediate access
      memoryToken = formattedToken;
      
      // For web, use localStorage directly as well for better reliability
      if (Platform.OS === 'web' && isBrowser) {
        window.localStorage.setItem(TOKEN_KEY, formattedToken);
        console.log('Token stored in localStorage');
      }
      
      // Also store in AsyncStorage for cross-platform compatibility
      await AsyncStorage.setItem(TOKEN_KEY, formattedToken);
      console.log('Token stored successfully in AsyncStorage');
      
      // Verify token was stored (debug only)
      if (__DEV__) {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        console.log('Token storage verification:', storedToken ? 'success' : 'failed');
      }
    } catch (error) {
      console.error('Error storing token:', error);
      // Even if AsyncStorage fails, we still have the memory token
    }
  }

  /**
   * Retrieve stored authentication token
   * @returns Stored token or null if not found
   */
  async getToken(): Promise<string | null> {
    try {
      // Check memory first for best performance
      if (memoryToken) {
        return memoryToken;
      }
      
      // For web, try localStorage next
      if (Platform.OS === 'web' && isBrowser) {
        const localToken = window.localStorage.getItem(TOKEN_KEY);
        if (localToken) {
          // Update memory cache
          memoryToken = localToken;
          return localToken;
        }
      }
      
      // Finally, try AsyncStorage
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      // Update memory cache if found
      if (token) {
        memoryToken = token;
      }
      
      if (__DEV__) {
        console.log('Token status:', token ? 'exists' : 'not found');
      }
      
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      // Fall back to memory token if AsyncStorage fails
      return memoryToken;
    }
  }

  /**
   * Clear stored authentication token
   */
  async clearToken(): Promise<void> {
    try {
      console.log('Clearing token from all storage mechanisms...');
      
      // Clear memory reference first
      memoryToken = null;
      
      // For web, clear localStorage
      if (Platform.OS === 'web' && isBrowser) {
        window.localStorage.removeItem(TOKEN_KEY);
        console.log('Cleared token from localStorage');
        
        // Double check
        if (window.localStorage.getItem(TOKEN_KEY)) {
          window.localStorage.clear(); // More aggressive clearing if needed
        }
      }
      
      // Clear from AsyncStorage
      await AsyncStorage.removeItem(TOKEN_KEY);
      console.log('Token cleared from AsyncStorage');
      
      // Verify token is completely cleared
      if (__DEV__) {
        let stillExists = false;
        
        // Check AsyncStorage
        const asyncToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (asyncToken) {
          stillExists = true;
          console.warn('Token still exists in AsyncStorage after clearing, trying again...');
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
        
        // Check localStorage
        if (Platform.OS === 'web' && isBrowser && window.localStorage.getItem(TOKEN_KEY)) {
          stillExists = true;
          console.warn('Token still exists in localStorage after clearing, trying again...');
          window.localStorage.removeItem(TOKEN_KEY);
        }
        
        if (!stillExists) {
          console.log('Token verified as cleared from all storage');
        }
      }
    } catch (error) {
      console.error('Error clearing token:', error);
      // Still make sure memory token is cleared even if other methods fail
      memoryToken = null;
    }
  }

  /**
   * Check if token exists without retrieving its value
   */
  async hasToken(): Promise<boolean> {
    return !!(await this.getToken());
  }
}

// Export a singleton instance
export const tokenService = new TokenService();
export default tokenService;
