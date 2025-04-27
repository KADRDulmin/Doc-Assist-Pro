import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

/**
 * Doctor Portal app tabs layout
 * This handles the bottom tab navigation for authenticated doctors
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.text,
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
          headerShown: true,
          headerTitle: 'Doctor Dashboard',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerStyle: {
            backgroundColor: Colors.light.primary,
          },
          headerTintColor: '#fff',
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-alt" size={size} color={color} />
          ),
          headerShown: true,
          headerTitle: 'My Appointments',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerStyle: {
            backgroundColor: Colors.light.primary,
          },
          headerTintColor: '#fff',
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users" size={size} color={color} />
          ),
          headerShown: true,
          headerTitle: 'My Patients',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerStyle: {
            backgroundColor: Colors.light.primary,
          },
          headerTintColor: '#fff',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-md" size={size} color={color} />
          ),
          headerShown: true,
          headerTitle: 'My Profile',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerStyle: {
            backgroundColor: Colors.light.primary,
          },
          headerTintColor: '#fff',
        }}
      />
    </Tabs>
  );
}
