import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" options={{ title: "Patient Registration" }} />
      {/* Add any other auth screens here */}
    </Stack>
  );
}
