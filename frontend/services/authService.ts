/**
 * Authentication service for handling login, registration, and logout
 */
import { apiRequest, HTTP_METHODS } from '@/services/api';
import { tokenService } from '@/services/tokenService';

// Types for authentication payloads
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  message?: string;
}

/**
 * Log in a user with email and password
 * @param credentials - User login credentials
 * @returns Promise with auth token
 */
const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>('/api/auth/login', HTTP_METHODS.POST, credentials);
  
  // Store the token for future requests
  if (response.token) {
    await tokenService.storeToken(response.token);
    console.log('Token stored successfully');
  }
  
  return response;
};

/**
 * Register a new user
 * @param credentials - New user registration data
 * @returns Promise with registration response
 */
const register = async (credentials: RegisterCredentials): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>('/api/auth/register', HTTP_METHODS.POST, credentials);
};

/**
 * Log out the current user
 */
const logout = async (): Promise<void> => {
  console.log('Logging out user, clearing token...');
  try {
    // Clear token from storage
    await tokenService.clearToken();
    console.log('Token cleared successfully');
    
    // Additional verification step
    const tokenAfterClear = await tokenService.getToken();
    if (tokenAfterClear) {
      console.warn('Token still exists after clearing!');
      // Force another clear attempt
      await tokenService.clearToken();
    } else {
      console.log('Token verification: successfully cleared');
    }
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

/**
 * Check if a user is authenticated
 * @returns Boolean indicating if user is authenticated
 */
const isAuthenticated = async (): Promise<boolean> => {
  const token = await tokenService.getToken();
  return !!token;
};

export const authService = {
  login,
  register,
  logout,
  isAuthenticated,
};
