/**
 * Authentication Controller
 * Handles business logic for authentication
 */
import { Platform } from 'react-native';
import { authApiService } from '../services/api/auth-api.service';
import { tokenService } from '../services/token.service';
import { LoginCredentials, RegisterCredentials, PatientRegisterData, AuthResponse } from '../models/auth.model';
import { ApiResponse } from '../services/api/base-api.service';

class AuthController {
  /**
   * Handle user login
   * @param credentials - User login credentials
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('Auth controller: Attempting login...');
      const response = await authApiService.login(credentials);
      console.log('Auth controller: Login response received');
      
      // Enhanced token extraction and storage
      let token = null;
      
      // Check all possible locations for the token
      if (response.data?.token) {
        token = response.data.token;
        console.log('Auth controller: Found token in response.data.token');
      } else if (response.token) {
        token = response.token;
        console.log('Auth controller: Found token in response.token');
      } else if (response.data?.data?.token) {
        token = response.data.data.token;
        console.log('Auth controller: Found token in response.data.data.token');
      }
      
      // Store token if found
      if (token) {
        console.log('Auth controller: Storing token...');
        await tokenService.storeToken(token);
        
        // Verify token was stored correctly
        const storedToken = await tokenService.getToken();
        console.log('Auth controller: Token stored successfully:', !!storedToken);
      } else {
        console.error('Auth controller: No token found in login response!', response);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed in controller:', error);
      throw error;
    }
  }

  /**
   * Handle user registration
   * @param credentials - New user registration data
   */
  async register(credentials: RegisterCredentials) {
    try {
      return await authApiService.register(credentials);
    } catch (error) {
      console.error('Registration failed in controller:', error);
      throw error;
    }
  }

  /**
   * Handle patient registration
   * @param patientData - New patient registration data with profile
   */
  async registerPatient(patientData: PatientRegisterData) {
    try {
      return await authApiService.registerPatient(patientData);
    } catch (error) {
      console.error('Patient registration failed in controller:', error);
      throw error;
    }
  }

  /**
   * Handle user logout
   * Platform-specific implementation
   */
  async logout() {
    try {
      console.log('Logging out user, clearing token...');
      
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
      
      return { success: true };
    } catch (error) {
      console.error('Error during logout in controller:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await tokenService.getToken();
      console.log('Auth check: Token exists =', !!token);
      return !!token;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<AuthResponse>> {
    try {
      return await authApiService.getCurrentUser();
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }
  
  /**
   * Debug: Print token to console
   * For debugging purposes only
   */
  async debugToken(): Promise<void> {
    if (__DEV__) {
      const token = await tokenService.getToken();
      console.log('DEBUG - Current token:', token ? 'Token exists' : 'No token');
    }
  }
}

// Create a singleton instance
export const authController = new AuthController();
