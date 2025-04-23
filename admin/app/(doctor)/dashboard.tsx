import React, { useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/contexts/AuthContext';

// Simple color constants
const Colors = {
  primary: '#0066cc',
  secondary: '#00a86b',
  text: '#333333',
  background: '#f8f9fa',
  white: '#ffffff',
  grey: '#888888',
};

export default function DoctorDashboardScreen() {
  // Get the logout function from AuthContext
  const { logout, userInfo } = useContext(AuthContext);

  // Mock data
  const appointments = [
    { id: 1, patient: 'John Doe', time: '9:00 AM', type: 'Check-up' },
    { id: 2, patient: 'Jane Smith', time: '10:30 AM', type: 'Follow-up' },
    { id: 3, patient: 'Robert Brown', time: '2:00 PM', type: 'Consultation' },
  ];

  const handleLogout = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? Your account will be marked as inactive.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error during logout:', error);
              // Fallback if logout fails
              router.replace('/auth/welcome');
            }
          }
        }
      ]
    );
  };

  // Get doctor's name from context
  const doctorName = userInfo ? 
    `Dr. ${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : 
    'Doctor';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {doctorName}</Text>
        <Text style={styles.subHeading}>Today's Appointments</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

      {appointments.map(appointment => (
        <View key={appointment.id} style={styles.appointmentCard}>
          <Text style={styles.patientName}>{appointment.patient}</Text>
          <Text style={styles.appointmentTime}>{appointment.time}</Text>
          <Text style={styles.appointmentType}>{appointment.type}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subHeading: {
    fontSize: 18,
    color: Colors.grey,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2, // Keep elevation for Android
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.grey,
    marginTop: 5,
  },
  appointmentCard: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2, // Keep elevation for Android
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  appointmentTime: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 5,
  },
  appointmentType: {
    fontSize: 14,
    color: Colors.grey,
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
