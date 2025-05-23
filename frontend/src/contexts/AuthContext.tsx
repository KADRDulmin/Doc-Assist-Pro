import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { EventEmitter } from 'events';
import { authController } from '../controllers/auth.controller';
import { tokenService } from '../services/token.service';
import { LoginCredentials, RegisterCredentials, PatientRegisterData } from '../models/auth.model';

// Create a global event emitter for auth events (accessible by services)
if (!global.authEventEmitter) {
  global.authEventEmitter = new EventEmitter();
}

// Define the shape of the authentication context
interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  registerPatient: (patientData: PatientRegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

// Create the auth context with a default value
const AuthContext = createContext<AuthContextType>({
  isLoading: false,
  isAuthenticated: null,
  error: null,
  login: async () => false,
  register: async () => false,
  registerPatient: async () => false,
  logout: async () => {},
  refreshAuthState: async () => {}
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
        // First check for a token directly
        const token = await tokenService.getToken();
        console.log('[AuthContext] Initial token check:', token ? 'token exists' : 'no token');
        
        if (token) {
          setIsAuthenticated(true);
        } else {
          // Fall back to controller check
          const isAuth = await authController.isAuthenticated();
          setIsAuthenticated(isAuth);
          
          // Log detailed information in dev mode
          if (__DEV__) {
            console.log(`[AuthContext] Auth controller check: isAuthenticated=${isAuth}`);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Set up listener for forced logout events from API services
    const handleForcedLogout = async (data: { message: string }) => {
      console.log('[AuthContext] Forced logout triggered:', data.message);
      try {
        // Clear authentication state
        await tokenService.clearToken();
        setIsAuthenticated(false);
        
        // Show alert with the error message
        Alert.alert('Session Expired', data.message || 'Your session has expired. Please log in again.');
        
        // Redirect to login screen
        router.replace('/auth/login');
      } catch (err) {
        console.error('[AuthContext] Error during forced logout:', err);
      }
    };
    
    // Add event listeners based on platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Web platform uses window events
      window.addEventListener('auth:forcedLogout', ((e: CustomEvent) => {
        handleForcedLogout(e.detail);
      }) as EventListener);
      
      return () => {
        window.removeEventListener('auth:forcedLogout', ((e: CustomEvent) => {
          handleForcedLogout(e.detail);
        }) as EventListener);
      };
    } else {
      // React Native uses the global event emitter
      global.authEventEmitter.on('forcedLogout', handleForcedLogout);
      
      return () => {
        global.authEventEmitter.off('forcedLogout', handleForcedLogout);
      };
    }
  }, []);

  // Watch authentication state changes to handle navigation
  useEffect(() => {
    // When auth state changes from authenticated to not authenticated, redirect to login
    if (isAuthenticated === false && !isLoading) {
      // Small delay to ensure context updates propagate
      const redirectTimer = setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, isLoading]);

  // Function to refresh auth state
  const refreshAuthState = async (): Promise<void> => {
    try {
      const token = await tokenService.getToken();
      const isAuth = !!token;
      console.log('[AuthContext] Refreshing auth state, token exists:', isAuth);
      setIsAuthenticated(isAuth);
    } catch (err) {
      console.error('[AuthContext] Error refreshing auth state:', err);
      setIsAuthenticated(false);
    }
  };

  // Handle user login
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[AuthContext] Attempting login...');
      const response = await authController.login(credentials);
      console.log('[AuthContext] Login successful, checking token...');
      
      // Verify token was stored
      const token = await tokenService.getToken();
      if (token) {
        console.log('[AuthContext] Login complete, token verified');
        setIsAuthenticated(true);
        return true;
      } else {
        console.error('[AuthContext] Login complete but no token found!');
        
        // Try again to store the token from the response
        if (response.data?.token || response.token) {
          const tokenToStore = response.data?.token || response.token;
          console.log('[AuthContext] Attempting to store token directly...');
          await tokenService.storeToken(tokenToStore);
          
          // Check again
          const retryToken = await tokenService.getToken();
          if (retryToken) {
            console.log('[AuthContext] Token stored successfully on retry');
            setIsAuthenticated(true);
            return true;
          } else {
            console.error('[AuthContext] Failed to store token even on retry');
          }
        }
        
        setError('Authentication successful but failed to save session');
        Alert.alert('Session Error', 'Failed to save your session. Please try again.');
        return false;
      }
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
      await tokenService.clearToken(); // Ensure token is cleared
      setIsAuthenticated(false);
      
      // Explicit navigation to login screen
      router.replace('/auth/login');
    } catch (err: any) {
      const errorMessage = err.message || 'Logout failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Logout Error', errorMessage);
      
      // Even if logout fails, we should clear token and redirect
      await tokenService.clearToken();
      setIsAuthenticated(false);
      router.replace('/auth/login');
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
      logout,
      refreshAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);