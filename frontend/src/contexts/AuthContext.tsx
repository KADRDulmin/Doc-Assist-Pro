import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { authController } from '../controllers/auth.controller';
import { LoginCredentials, RegisterCredentials, PatientRegisterData } from '../models/auth.model';

// Define the shape of the authentication context
interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  registerPatient: (patientData: PatientRegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Create the auth context with a default value
const AuthContext = createContext<AuthContextType>({
  isLoading: false,
  isAuthenticated: null,
  error: null,
  login: async () => false,
  register: async () => false,
  registerPatient: async () => false,
  logout: async () => {}
});

// Props for AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component that wraps the app
export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authController.isAuthenticated();
        setIsAuthenticated(isAuth);
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle user login
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authController.login(credentials);
      setIsAuthenticated(true);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Login Error', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user registration
  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authController.register(credentials);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Registration Error', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle patient registration
  const registerPatient = async (patientData: PatientRegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authController.registerPatient(patientData);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Patient registration failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Registration Error', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user logout
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authController.logout();
      setIsAuthenticated(false);
    } catch (err: any) {
      const errorMessage = err.message || 'Logout failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Logout Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the auth context values to the children
  return (
    <AuthContext.Provider value={{
      isLoading,
      isAuthenticated,
      error,
      login,
      register,
      registerPatient,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);