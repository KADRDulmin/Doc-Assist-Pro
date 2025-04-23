import React, { useContext, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import DoctorNavigator from './DoctorNavigator';
import PatientNavigator from './PatientNavigator';
import AdminNavigator from './AdminNavigator';
import Colors from '../constants/Colors';

const AppNavigator = () => {
  const { isLoading, userToken, userRole, isLoggedIn } = useContext(AuthContext);
  const [initializing, setInitializing] = useState(true);

  // Check for existing login on app launch
  useEffect(() => {
    const checkLoginState = async () => {
      try {
        await isLoggedIn();
      } catch (error) {
        console.error('Login check error:', error);
      } finally {
        setInitializing(false);
      }
    };
    
    checkLoginState();
  }, []);

  if (initializing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary || '#0066cc'} />
        <Text style={{ marginTop: 10, color: Colors.text || '#333333' }}>Loading...</Text>
      </View>
    );
  }

  // Determine which navigator to show based on authentication and role
  if (!userToken) {
    return <AuthNavigator />;
  }

  // Choose the appropriate navigator based on user role
  switch (userRole) {
    case 'doctor':
      return <DoctorNavigator />;
    case 'admin':
      return <AdminNavigator />;
    case 'patient':
      return <PatientNavigator />;
    default:
      // Fallback to auth navigator if role is unknown
      return <AuthNavigator />;
  }
};

export default AppNavigator;
