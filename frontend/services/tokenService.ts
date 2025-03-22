/**
 * Token service for managing authentication tokens
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

// For web, keep a memory reference as a fallback
let memoryToken: string | null = null;

/**
 * Store authentication token
 * @param token - JWT token to store
 */
const storeToken = async (token: string): Promise<void> => {
  try {
    if (!token) {
      console.warn('Attempted to store empty token');
      return;
    }
    
    // For web, store in memory as well
    if (Platform.OS === 'web') {
      memoryToken = token;
    }
    
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('Token stored successfully');
  } catch (error) {
    console.error('Error storing token:', error);
    throw new Error('Failed to store authentication token');
  }
};

/**
 * Retrieve stored authentication token
 * @returns Stored token or null if not found
 */
const getToken = async (): Promise<string | null> => {
  try {
    // For web, check memory first
    if (Platform.OS === 'web' && memoryToken) {
      return memoryToken;
    }
    
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('Token status:', token ? 'exists' : 'not found');
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Clear stored authentication token
 */
const clearToken = async (): Promise<void> => {
  try {
    console.log('Clearing token...');
    
    // For web, clear memory reference first
    if (Platform.OS === 'web') {
      memoryToken = null;
      
      // For web, use localStorage directly as a fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        console.log('Cleared token from localStorage');
      }
    }
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('Token cleared from AsyncStorage');
    
    // Verify token is cleared
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      console.warn('Token still exists after clearing, trying again...');
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      console.log('Token verified as cleared');
    }
  } catch (error) {
    console.error('Error clearing token:', error);
    throw new Error('Failed to clear authentication token');
  }
};

export const tokenService = {
  storeToken,
  getToken,
  clearToken,
};
