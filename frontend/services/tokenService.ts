/**
 * Token service for managing authentication tokens
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

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
    const token = await AsyncStorage.getItem(TOKEN_KEY);
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
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('Token cleared successfully');
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
