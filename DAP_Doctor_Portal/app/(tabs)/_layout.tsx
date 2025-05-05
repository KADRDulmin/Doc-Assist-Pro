import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernHeader from '../../components/ui/ModernHeader';

/**
 * Doctor Portal app tabs layout
 * This handles the bottom tab navigation for authenticated doctors
 * Now with improved light/dark theme support
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <>
      <StatusBar style={Colors[theme].statusBarStyle} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[theme].primary,
          tabBarInactiveTintColor: Colors[theme].tabIconDefault,
          headerShown: false, // Hide default header, we'll use ModernHeader instead
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 5,
            backgroundColor: Colors[theme].background,
            borderTopColor: Colors[theme].border,
            borderTopWidth: 1,
            elevation: colorScheme === 'dark' ? 0 : 4,
            shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="calendar-alt" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="users" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="user-md" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
