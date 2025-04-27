import React from 'react';
import { Stack } from 'expo-router';
import Colors from '../../constants/Colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.light.primary,
        },
        headerTintColor: Colors.light.background,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Doctor Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Doctor Registration',
          headerShown: false,
        }}
      />
    </Stack>
  );
}