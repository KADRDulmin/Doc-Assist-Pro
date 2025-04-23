import { Stack } from 'expo-router';

export default function DoctorLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: "Doctor Dashboard",
          headerBackVisible: false 
        }} 
      />
    </Stack>
  );
}
