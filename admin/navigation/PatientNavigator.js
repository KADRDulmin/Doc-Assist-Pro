import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

// This is a placeholder - replace with your actual patient screens
// For now, we'll create a temporary component to avoid errors
import { View, Text } from 'react-native';
import Colors from '../constants/Colors';
import Header from '../components/Header';

// Placeholder component for patient screens
const PlaceholderScreen = ({ title }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18 }}>Patient {title} Screen</Text>
    <Text style={{ marginTop: 10 }}>Coming Soon</Text>
  </View>
);

// Create stack screens
const PatientHomeScreen = () => <PlaceholderScreen title="Home" />;
const PatientAppointmentsScreen = () => <PlaceholderScreen title="Appointments" />;
const PatientDoctorsScreen = () => <PlaceholderScreen title="Doctors" />;
const PatientProfileScreen = () => <PlaceholderScreen title="Profile" />;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Home
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ header: (props) => <Header {...props} /> }}>
    <Stack.Screen name="PatientHome" component={PatientHomeScreen} options={{ title: 'Home' }} />
  </Stack.Navigator>
);

// Stack navigator for Appointments
const AppointmentsStack = () => (
  <Stack.Navigator screenOptions={{ header: (props) => <Header {...props} /> }}>
    <Stack.Screen name="PatientAppointments" component={PatientAppointmentsScreen} options={{ title: 'Appointments' }} />
  </Stack.Navigator>
);

// Stack navigator for Doctors
const DoctorsStack = () => (
  <Stack.Navigator screenOptions={{ header: (props) => <Header {...props} /> }}>
    <Stack.Screen name="PatientDoctors" component={PatientDoctorsScreen} options={{ title: 'Doctors' }} />
  </Stack.Navigator>
);

// Stack navigator for Profile
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ header: (props) => <Header {...props} /> }}>
    <Stack.Screen name="PatientProfile" component={PatientProfileScreen} options={{ title: 'My Profile' }} />
  </Stack.Navigator>
);

const PatientNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Appointments':
              iconName = 'event';
              break;
            case 'Doctors':
              iconName = 'medical-services';
              break;
            case 'Profile':
              iconName = 'person';
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Appointments" component={AppointmentsStack} />
      <Tab.Screen name="Doctors" component={DoctorsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default PatientNavigator;
