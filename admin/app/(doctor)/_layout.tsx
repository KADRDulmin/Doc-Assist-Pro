import React from 'react';
import { Stack } from 'expo-router';

export default function DoctorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: "Doctor Dashboard"
        }} 
      />
    </Stack>
  );
}
