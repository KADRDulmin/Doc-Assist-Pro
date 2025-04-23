import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  // Use state to delay navigation until component is fully mounted
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure the root layout is mounted before navigation
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading placeholder while preparing to navigate
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Only redirect once component is fully mounted
  return <Redirect href="/auth/welcome" />;
}
