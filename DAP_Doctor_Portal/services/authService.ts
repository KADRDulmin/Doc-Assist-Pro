import api, { ApiResponse } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth token storage key
const AUTH_TOKEN_KEY = 'doctor_auth_token';
const USER_DATA_KEY = 'doctor_user_data';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface DoctorSignupData {
  // User data
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  
  // Doctor profile data
  specialization: string;
  license_number: string;
  years_of_experience?: number;
  education?: string;
  bio?: string;
  consultation_fee?: number;
}

export interface DoctorUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
}

export interface DoctorProfile {
  id: number;
  user_id: number;
  specialization: string;
  license_number: string;
  years_of_experience: number;
  education: string;
  bio: string;
  consultation_fee: number;
  user?: DoctorUser;
}

export interface AuthResponse {
  user: DoctorUser;
  token: string;
}

export const authService = {
  // Login doctor
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    console.log(`Attempting to login with email: ${credentials.email}`);
    
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      console.log('Login response received:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        // Check if token and user data are in the data property as expected
        if (response.data?.token && response.data?.user) {
          console.log('Login successful, saving user data and token from data property');
          
          // Save token and user data to storage
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
          
          return response; // Already in the right format
        } 
        // Check if token and user are at root level (direct API response format)
        else {
          // Cast the response to access possible root-level properties
          const rawResponse = response as unknown as { 
            success: boolean; 
            token?: string; 
            user?: DoctorUser; 
            error?: string 
          };
          
          if (rawResponse.token && rawResponse.user) {
            console.log('Login successful, saving user data and token from root level');
            
            // Save token and user data to storage
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, rawResponse.token);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(rawResponse.user));
            
            // Return in the expected format for the app
            return {
              success: true,
              data: {
                token: rawResponse.token,
                user: rawResponse.user
              } as AuthResponse,
              error: undefined
            };
          }
          else {
            // Handle case where response is successful but doesn't have expected structure
            console.error('Server response missing token or user data:', response);
            return {
              success: false,
              data: {} as AuthResponse,
              error: 'Invalid server response format'
            };
          }
        }
      } else {
        console.log('Login failed:', response.error ?? 'Unknown error');
        return response;
      }
    } catch (error: any) {
      console.error('Exception during login:', error);
      return {
        success: false,
        data: {} as AuthResponse,
        error: error.message ?? 'An unexpected error occurred during login'
      };
    }
  },
  
  // Register new doctor
  signup: async (doctorData: DoctorSignupData): Promise<ApiResponse> => {
    // Using the working endpoint that you confirmed in your tests
    console.log('Registering doctor with data:', JSON.stringify(doctorData, null, 2));
    return api.post('/doctors/register', doctorData);
  },
  
  // Log out doctor
  logout: async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        // Call logout endpoint if needed
        await api.post('/auth/logout', {}, token);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear stored data regardless of API call result
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    }
  },
  
  // Check if user is logged in
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },
  
  // Get stored auth token
  getToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },
  
  // Get current user data
  getCurrentUser: async (): Promise<DoctorUser | null> => {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  // Refresh token
  refreshToken: async (): Promise<boolean> => {
    try {
      const currentToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!currentToken) {
        return false;
      }
      
      const response = await api.post<{ token: string }>('/auth/refresh-token', { token: currentToken });
      
      if (response.success && response.data?.token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  },
  
  // Get doctor specializations
  getDoctorSpecializations: async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>('/doctors/specializations/list');
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Error fetching specializations:', error);
      return [];
    }
  }
};

export default authService;