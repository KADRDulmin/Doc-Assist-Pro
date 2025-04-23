import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

// This is a placeholder - replace with your actual admin screens
// For now, we'll create a temporary component to avoid errors
import { View, Text } from 'react-native';
import Colors from '../constants/Colors';
import Header from '../components/Header';

// Placeholder component for admin screens
const PlaceholderScreen = ({ title }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18 }}>Admin {title} Screen</Text>
    <Text style={{ marginTop: 10 }}>Coming Soon</Text>
  </View>
);

// Create stack screens
const AdminDashboardScreen = () => <PlaceholderScreen title="Dashboard" />;
const AdminUsersScreen = () => <PlaceholderScreen title="Users" />;
const AdminSettingsScreen = () => <PlaceholderScreen title="Settings" />;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Dashboard
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ header: (props) => <Header {...props} /> }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
  </Stack.Navigator>
);

// Stack navigator for Users
const UsersStack = () => (
  <Stack.Navigator screenOptions={{ header: (props) => <Header {...props} /> }}>
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Users' }} />
  </Stack.Navigator>
);

// Stack navigator for Settings
const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ header: (props) => <Header {...props} /> }}>
    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'Settings' }} />
  </Stack.Navigator>
);

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Users':
              iconName = 'people';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help-outline';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary || '#0066cc',
        tabBarInactiveTintColor: Colors.grey || '#888888',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Users" component={UsersStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
