import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PatientLoginScreen from '../screens/auth/PatientLoginScreen';
import PatientRegisterScreen from '../screens/auth/PatientRegisterScreen';
import DoctorLoginScreen from '../screens/auth/DoctorLoginScreen';
import DoctorRegisterScreen from '../screens/auth/DoctorRegisterScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' }
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      
      {/* Patient Auth Screens */}
      <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
      <Stack.Screen name="PatientRegister" component={PatientRegisterScreen} />
      
      {/* Doctor Auth Screens */}
      <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
      <Stack.Screen name="DoctorRegister" component={DoctorRegisterScreen} />
      
      {/* Admin Auth Screen */}
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      
      {/* Utility Auth Screens */}
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
