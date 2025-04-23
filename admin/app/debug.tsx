import { View } from 'react-native';
import ApiDebug from '@/components/ApiDebug';
import { Stack } from 'expo-router';

export default function DebugScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'API Debug' }} />
      <ApiDebug />
    </View>
  );
}
