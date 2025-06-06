import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import authService, { DoctorUser } from '../services/authService';
import { registerUnauthorizedHandler } from '../services/api';

// Simple custom EventEmitter for React Native that doesn't rely on Node.js
class SimpleEventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(...args));
  }
}

// Create a global object for event handling that doesn't rely on Node.js EventEmitter
if (!global.authEventEmitter) {
  global.authEventEmitter = new SimpleEventEmitter();
}

// Make TypeScript aware of our global addition
declare global {
  var authEventEmitter: SimpleEventEmitter;
}

// Define the shape of our authentication context
interface AuthContextType {
  user: DoctorUser | null;
  isLoading: boolean;
  token: string | null; // Add token to the context
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  authError: string | null;
}

// Create the auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  token: null, // Default token value
  signIn: async () => false,
  signOut: async () => {},
  authError: null,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth data available
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [token, setToken] = useState<string | null>(null); // Add token state
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Register the unauthorized error handler
  useEffect(() => {
    // Register a handler for 401 unauthorized errors
    registerUnauthorizedHandler(() => {
      console.log('AuthContext: Handling unauthorized error - logging out user');
      // Call our signOut function to clear the auth state and redirect
      authService.logout().finally(() => {
        setUser(null);
        setToken(null);
        router.replace('/auth/login');
      });
    });
  }, [router]);
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated) {
          const userData = await authService.getCurrentUser();
          const authToken = await authService.getToken();
          
          // Load dashboard data to get stats for the user
          if (userData && authToken) {
            try {
              // Import doctorService here to avoid circular dependency
              const doctorService = require('../services/doctorService').default;
              const dashboardResponse = await doctorService.getDashboard(authToken);
              
              if (dashboardResponse.success && dashboardResponse.data) {
                // Update the user object with the dashboard stats
                const stats = dashboardResponse.data.stats;
                userData.appointments_count = stats.appointmentCount;
                userData.patients_count = stats.patientCount;
                userData.experience_years = userData.experience_years || 
                  dashboardResponse.data.profile.years_of_experience || 0;
                
                // Save the updated user data
                await authService.updateUserData(userData);
              }
            } catch (dashboardError) {
              console.error('Error loading dashboard data:', dashboardError);
              // Continue with the existing user data even if dashboard fetch fails
            }
          }
          
          setUser(userData);
          setToken(authToken); // Store token in state
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle routing based on authentication state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (!user && !inAuthGroup) {
      // Redirect to login if user is not signed in and not on auth screen
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if user is signed in and on auth screen
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);
  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthError(null);
      
      console.log(`AuthContext: Starting login for ${email}`);
      const response = await authService.login({ email, password });
      
      console.log('AuthContext: Login response received:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        // Check if user has the doctor role
        if (response.data.user.role !== 'doctor') {
          console.log(`AuthContext: User has incorrect role: ${response.data.user.role}`);
          setAuthError('Access denied. This portal is for doctors only.');
          return false;
        }
        
        console.log('AuthContext: Setting authenticated user state');
        
        // Save login information first
        const userData = response.data.user;
        const authToken = response.data.token;
        
        // Load dashboard data to get stats
        try {
          if (authToken) {
            // Import doctorService here to avoid circular dependency
            const doctorService = require('../services/doctorService').default;
            const dashboardResponse = await doctorService.getDashboard(authToken, userData.id);
            
            if (dashboardResponse.success && dashboardResponse.data) {
              // Update the user object with the dashboard stats
              const stats = dashboardResponse.data.stats;
              userData.appointments_count = stats.appointmentCount;
              userData.patients_count = stats.patientCount;
              userData.experience_years = userData.experience_years || 
                dashboardResponse.data.profile.years_of_experience || 0;
              
              // Save the updated user data
              await authService.updateUserData(userData);
            }
          }
        } catch (dashboardError) {
          console.error('Error loading dashboard data after login:', dashboardError);
        }
        
        // Update state with user and token
        setUser(userData);
        setToken(authToken); // Store token when signing in
        
        // Force navigation to the tabs
        setTimeout(() => {
          console.log('AuthContext: Navigating to tabs');
          router.replace('/(tabs)');
        }, 500);
        
        return true;
      } else {
        console.error('AuthContext: Login failed:', response.error);
        setAuthError(response.error || 'Login failed. Please check your credentials.');
        return false;
      }
    } catch (error: any) {
      console.error('AuthContext: Exception in signIn:', error);
      setAuthError(error.message || 'An unexpected error occurred');
      return false;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await authService.logout();
      setUser(null);
      setToken(null); // Clear token when signing out
      router.replace('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Value object to provide through context
  const authContextValue: AuthContextType = {
    user,
    isLoading,
    token, // Include token in context value
    signIn,
    signOut,
    authError,
  };

  return (
    <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
  );
}