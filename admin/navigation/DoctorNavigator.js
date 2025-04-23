import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

// Doctor screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorPatientsScreen from '../screens/doctor/DoctorPatientsScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';
import DoctorSettingsScreen from '../screens/doctor/DoctorSettingsScreen';

// Common components
import Header from '../components/Header';
import Colors from '../constants/Colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Dashboard
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: (props) => <Header {...props} />,
    }}
  >
    <Stack.Screen 
      name="DoctorDashboard" 
      component={DoctorDashboardScreen} 
      options={{ title: 'Dashboard' }}
    />
  </Stack.Navigator>
);

// Stack navigator for Appointments
const AppointmentsStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: (props) => <Header {...props} />,
    }}
  >
    <Stack.Screen 
      name="DoctorAppointments" 
      component={DoctorAppointmentsScreen} 
      options={{ title: 'Appointments' }}
    />
  </Stack.Navigator>
);

// Stack navigator for Patients
const PatientsStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: (props) => <Header {...props} />,
    }}
  >
    <Stack.Screen 
      name="DoctorPatients" 
      component={DoctorPatientsScreen} 
      options={{ title: 'My Patients' }}
    />
  </Stack.Navigator>
);

// Stack navigator for Profile
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: (props) => <Header {...props} />,
    }}
  >
    <Stack.Screen 
      name="DoctorProfile" 
      component={DoctorProfileScreen} 
      options={{ title: 'My Profile' }}
    />
  </Stack.Navigator>
);

// Stack navigator for Settings
const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: (props) => <Header {...props} />,
    }}
  >
    <Stack.Screen 
      name="DoctorSettings" 
      component={DoctorSettingsScreen} 
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

// Main bottom tab navigator for doctors
const DoctorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Appointments':
              iconName = 'event';
              break;
            case 'Patients':
              iconName = 'people';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help-outline';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grey,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Appointments" component={AppointmentsStack} />
      <Tab.Screen name="Patients" component={PatientsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

export default DoctorNavigator;
