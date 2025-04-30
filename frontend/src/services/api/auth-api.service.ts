/**
 * Authentication API Service
 * Handles all authentication-related API requests
 */
import BaseApiService, { HttpMethod } from './base-api.service';
import { ApiResponse } from './base-api.service';
import { tokenService } from '../token.service';
import { 
  LoginCredentials, 
  RegisterCredentials,
  PatientRegisterData,
  AuthResponse, 
  RegisterResponse 
} from '../../models/auth.model';

class AuthApiService extends BaseApiService {
  private readonly AUTH_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REGISTER_PATIENT: '/api/auth/register/patient',
    ME: '/api/auth/me'
  };

  /**
   * Send login request to API
   * @param credentials - Login credentials
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('[AuthApiService] Sending login request...');
      
      // Login doesn't require auth token
      const response = await this.request<ApiResponse<AuthResponse>>(
        this.AUTH_ENDPOINTS.LOGIN,
        HttpMethod.POST,
        credentials,
        false // No auth required for login
      );
      
      console.log('[AuthApiService] Login response received:', 
        response?.success === true ? 'success' : 'failed');
      
      // Attempt to extract and store token directly from the response
      let token = null;
      
      if (response?.data?.token) {
        token = response.data.token;
      } else if (response?.token) {
        token = response.token;
      } else if (response?.data?.data?.token) {
        token = response.data.data.token;
      }
      
      // Store token if found
      if (token) {
        console.log('[AuthApiService] Found token in response, storing...');
        await tokenService.storeToken(token);
      }
      
      return response;
    } catch (error) {
      console.error('[AuthApiService] Login request failed:', error);
      throw error;
    }
  }

  /**
   * Send registration request to API
   * @param credentials - Registration credentials
   */
  async register(credentials: RegisterCredentials): Promise<ApiResponse<RegisterResponse>> {
    // Registration doesn't require auth token
    return this.request<ApiResponse<RegisterResponse>>(
      this.AUTH_ENDPOINTS.REGISTER,
      HttpMethod.POST,
      credentials,
      false // No auth required for registration
    );
  }

  /**
   * Register a new patient with profile data
   * @param patientData - Patient registration data
   */
  async registerPatient(patientData: PatientRegisterData): Promise<ApiResponse<RegisterResponse>> {
    // Patient registration doesn't require auth token
    return this.request<ApiResponse<RegisterResponse>>(
      this.AUTH_ENDPOINTS.REGISTER_PATIENT,
      HttpMethod.POST,
      patientData,
      false // No auth required for registration
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<AuthResponse>> {
    // This endpoint requires authentication
    return this.request<ApiResponse<AuthResponse>>(
      this.AUTH_ENDPOINTS.ME,
      HttpMethod.GET,
      undefined,
      true // Requires authentication
    );
  }
}

// Create a singleton instance
export const authApiService = new AuthApiService();
