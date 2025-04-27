/**
 * Authentication hook for React components
 */
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { authController } from '../controllers/auth.controller';
import { LoginCredentials, RegisterCredentials, PatientRegisterData } from '../models/auth.model';
import { User } from '../models/user.model'; // Fix: Import User directly from user.model

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status and fetch user if authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authController.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        // If authenticated, try to fetch user data
        if (authenticated) {
          try {
            const userResponse = await authController.getCurrentUser();
            // Handle the response format correctly
            if (userResponse && userResponse.success) {
              setUser(userResponse.data?.user || null);
            }
          } catch (userErr) {
            console.error('Error fetching user data:', userErr);
            // Don't reset authentication on user fetch error
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authController.login(credentials);
      if (response.success && response.data) {
        setUser(response.data.user || null);
      }
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authController.register(credentials);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register patient function
  const registerPatient = useCallback(async (patientData: PatientRegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authController.registerPatient(patientData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Patient registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authController.logout();
      setIsAuthenticated(false);
      setUser(null);
      
      // Handle platform-specific navigation after logout
      if (Platform.OS === 'web') {
        setTimeout(() => {
          router.push('/(auth)/login');
        }, 200);
      } else {
        router.replace('/(auth)/login');
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    isAuthenticated,
    error,
    user,
    login,
    register,
    registerPatient,
    logout
  };
};
