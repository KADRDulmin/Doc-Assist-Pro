/**
 * Authentication Controller
 * Handles business logic for authentication
 */
import { Platform } from 'react-native';
// Fix the import path
import { authApiService } from '../services/api/auth-api.service';
import { tokenService } from '../services/token.service';
import { LoginCredentials, RegisterCredentials } from '../models/auth.model';

class AuthController {
  /**
   * Handle user login
   * @param credentials - User login credentials
   */
  async login(credentials: LoginCredentials) {
    try {
      const response = await authApiService.login(credentials);
      
      // Store the authentication token
      if (response.token) {
        await tokenService.storeToken(response.token);
        console.log('Token stored successfully');
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
    const token = await tokenService.getToken();
    return !!token;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      return await authApiService.getCurrentUser();
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const authController = new AuthController();
