import api from '../config/api';
import { tokenService } from './token.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface PatientRegisterData extends RegisterData {
  date_of_birth: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
    token: string;
  };
  message?: string;
  token?: string; // Add optional token at the root level for alternative API response format
}

class AuthService {
  /**
   * Attempt to login with email and password
   * @param credentials - Login credentials (email & password)
   * @returns Auth response containing user data and token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Login request doesn't require authentication
      const response = await api.post<AuthResponse>('/api/auth/login', credentials, false);
      console.log('Login response received:', response?.success);
      
      // Enhanced token extraction logic with better logging
      let token: string | null = null;
      
      // Extract token using proper path traversal with safeguards
      if (response?.data?.token) {
        console.log('Found token in response.data.token');
        token = response.data.token;
      } else if (response?.token) {
        console.log('Found token in response.token');
        token = response.token;
      } else if (typeof response === 'object' && response !== null) {
        // Try to find token in any response property
        console.log('Searching for token in response object');
        for (const key in response) {
          if (key === 'token' && typeof response[key] === 'string') {
            console.log('Found token in response root');
            token = response[key];
            break;
          } else if (
            key === 'data' && 
            typeof response[key] === 'object' && 
            response[key] !== null &&
            'token' in response[key] &&
            typeof response[key].token === 'string'
          ) {
            console.log('Found token in response.data');
            token = response[key].token;
            break;
          }
        }
      }
      
      // Check if we found a token and store it
      if (token) {
        // Ensure token has Bearer prefix
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        console.log('Storing token with Bearer prefix');
        await tokenService.storeToken(formattedToken);
        
        // Verify token was stored
        const storedToken = await tokenService.getToken();
        console.log('Token stored successfully:', !!storedToken);
      } else {
        console.warn('Login successful but no token found in response:', response);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register a new user account
   * @param userData - Registration data
   * @returns Auth response data
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Registration request doesn't require authentication
      return await api.post<AuthResponse>('/api/auth/register', userData, false);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Register a new patient with profile data
   * @param patientData - Patient registration data
   * @returns Auth response data
   */
  async registerPatient(patientData: PatientRegisterData): Promise<AuthResponse> {
    try {
      // Registration request doesn't require authentication
      return await api.post<AuthResponse>('/api/auth/register/patient', patientData, false);
    } catch (error) {
      console.error('Patient registration error:', error);
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      // Send logout request to server
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    }
    
    // Clear token regardless of server response
    await tokenService.clearToken();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await tokenService.getToken();
      return !!token; // Convert to boolean
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      return await api.get('/api/auth/me');
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;