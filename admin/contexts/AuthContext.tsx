import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { API_BASE_URL, API_PREFIX, apiFetch } from '@/config/api';

// Define interfaces for TypeScript
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
}

interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  userInfo: User | null;
  userRole: string | null;
  login: (email: string, password: string, expectedRole?: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  registerDoctor: (doctorData: any) => Promise<any>;
  logout: () => Promise<void>;
  isLoggedIn: () => Promise<boolean>;
}

// Create AuthContext
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check if user is logged in on app start
  useEffect(() => {
    isLoggedIn();
  }, []);

  // Check if user is logged in
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (token && userInfoStr) {
        const userInfoData = JSON.parse(userInfoStr);
        setUserToken(token);
        setUserInfo(userInfoData);
        setUserRole(userInfoData.role);
        
        // Updated navigation paths
        if (userInfoData.role === 'doctor') {
          router.replace("/(doctor)/dashboard");
        } else if (userInfoData.role === 'patient') {
          router.replace("/(tabs)");  // Default to tabs for patients
        } else if (userInfoData.role === 'admin') {
          router.replace("/(tabs)");  // Default to tabs for admin until admin UI is built
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string, expectedRole: string | null = null) => {
    try {
      setIsLoading(true);
      console.log(`Attempting login for: ${email} to ${API_BASE_URL}${API_PREFIX}/auth/login`);
      
      // Use the centralized apiFetch utility with proper endpoint
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      console.log('Login response:', JSON.stringify(data, null, 2));
      
      // If a specific role is expected, validate it
      if (expectedRole && data.user.role !== expectedRole) {
        throw new Error(`This account doesn't have ${expectedRole} access`);
      }
      
      // Store auth data
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
      
      setUserToken(data.token);
      setUserInfo(data.user);
      setUserRole(data.user.role);
      
      // Navigate based on role
      if (data.user.role === 'doctor') {
        router.replace("/(doctor)/dashboard");
      } else if (data.user.role === 'patient') {
        router.replace("/(tabs)");
      } else if (data.user.role === 'admin') {
        router.replace("/(tabs)");
      } else {
        router.replace("/");
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      
      // Add more descriptive error handling with proper type checking
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = `Unable to connect to the server at ${API_BASE_URL}. Please check your connection.`;
        } else {
          errorMessage = error.message;
        }
      }
      
      // Create a new error with a user-friendly message
      const friendlyError = new Error(errorMessage);
      throw friendlyError;
    } finally {
      setIsLoading(false);
    }
  };

  // Register a patient
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      console.log('Attempting patient registration');
      
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: 'patient', // Default role
        })
      });
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register a doctor
  const registerDoctor = async (doctorData: any) => {
    try {
      setIsLoading(true);
      console.log('Attempting doctor registration');
      
      const data = await apiFetch('/auth/register/doctor', {
        method: 'POST',
        body: JSON.stringify({
          email: doctorData.email,
          password: doctorData.password,
          first_name: doctorData.firstName,
          last_name: doctorData.lastName,
          phone: doctorData.phone,
          specialization: doctorData.specialization,
          license_number: doctorData.licenseNumber,
          years_of_experience: doctorData.yearsOfExperience ? parseInt(doctorData.yearsOfExperience) : undefined,
          education: doctorData.education,
          bio: doctorData.bio,
          consultation_fee: doctorData.consultationFee ? parseFloat(doctorData.consultationFee) : undefined
        })
      });
      
      return data;
    } catch (error) {
      console.error('Doctor registration error:', error);
      
      // User-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          Alert.alert(
            'Connection Error',
            `Unable to connect to the server at ${API_BASE_URL}. Make sure your backend server is running.`
          );
        }
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear auth data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      
      setUserToken(null);
      setUserInfo(null);
      setUserRole(null);
      
      // Navigate to welcome screen
      router.replace("/auth/welcome");
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Return the context provider with auth values and functions
  return (
    <AuthContext.Provider value={{
      isLoading,
      userToken,
      userInfo,
      userRole,
      login,
      register,
      registerDoctor,
      logout,
      isLoggedIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
