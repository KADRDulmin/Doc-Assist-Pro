import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSegments, Stack, usePathname, useRootNavigation } from 'expo-router';

export default function RouterDebug() {
  const segments = useSegments();
  const pathname = usePathname();
  const rootNavigation = useRootNavigation();
  
  // Get navigation state information
  const navigationState = rootNavigation?.getRootState?.();
  const routes = navigationState?.routes || [];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Router Debug' }} />
      
      <Text style={styles.title}>Current Route Path</Text>
      <View style={styles.box}>
        <Text>{pathname}</Text>
      </View>
      
      <Text style={styles.title}>Route Segments</Text>
      <View style={styles.box}>
        {segments.map((segment, index) => (
          <Text key={index} style={styles.segment}>
            {index}: {segment}
          </Text>
        ))}
      </View>
      
      <Text style={styles.title}>Available Routes</Text>
      <View style={styles.box}>
        {routes.map((route, index) => (
          <Text key={index} style={styles.route}>
            {route.name} {route.key}
          </Text>
        ))}
      </View>
      
      <Text style={styles.title}>Navigation State</Text>
      <View style={styles.box}>
        <Text style={styles.code}>{JSON.stringify(navigationState, null, 2)}</Text>
      </View>
      
      <Text style={styles.title}>Environment</Text>
      <View style={styles.box}>
        <Text>Expo Router version: {require('expo-router/package.json').version}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  box: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  segment: {
    marginVertical: 2,
    fontSize: 16,
  },
  route: {
    marginVertical: 2,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
