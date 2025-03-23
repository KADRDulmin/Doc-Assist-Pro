/**
 * Authentication API Service
 * Handles all authentication-related API requests
 */
import { BaseApiService, HttpMethod } from './base-api.service';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  RegisterResponse 
} from '../../models/auth.model';

class AuthApiService extends BaseApiService {
  private readonly AUTH_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  };

  /**
   * Send login request to API
   * @param credentials - Login credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>(
      this.AUTH_ENDPOINTS.LOGIN,
      HttpMethod.POST,
      credentials
    );
  }

  /**
   * Send registration request to API
   * @param credentials - Registration credentials
   */
  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    return this.request<RegisterResponse>(
      this.AUTH_ENDPOINTS.REGISTER,
      HttpMethod.POST,
      credentials
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    return this.request(
      this.AUTH_ENDPOINTS.ME,
      HttpMethod.GET,
      undefined,
      true // Requires authentication
    );
  }
}

// Create a singleton instance
export const authApiService = new AuthApiService();
