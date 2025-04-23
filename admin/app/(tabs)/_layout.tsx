import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Define colors directly here to prevent tint undefined error
const tintColorLight = '#0066cc';
const tintColorDark = '#0080ff';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = colorScheme === 'dark' ? tintColorDark : tintColorLight;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        // Prevent theme access that causes undefined error
        tabBarInactiveTintColor: '#888888',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <FontAwesome name="compass" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
