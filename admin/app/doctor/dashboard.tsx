import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// Use constants directly instead of importing from a module
const Colors = {
  primary: '#0066cc',
  secondary: '#00a86b',
  tertiary: '#444444',
  background: '#f8f9fa',
  text: '#333333',
  grey: '#888888',
  error: '#dc3545',
  success: '#28a745',
};

export default function DoctorDashboardScreen() {
  // Demo data
  const doctorName = "Dr. Smith";
  const appointments = [
    { id: 1, patientName: "John Doe", time: "9:00 AM", type: "Check-up" },
    { id: 2, patientName: "Jane Smith", time: "10:30 AM", type: "Follow-up" },
    { id: 3, patientName: "Robert Johnson", time: "1:00 PM", type: "Consultation" }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {doctorName}</Text>
        <Text style={styles.subtitle}>Here's your schedule for today</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
      </View>

      {appointments.map(appointment => (
        <View key={appointment.id} style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.patientName}>{appointment.patientName}</Text>
            <View style={styles.timeContainer}>
              <MaterialIcons name="access-time" size={16} color={Colors.grey} />
              <Text style={styles.appointmentTime}>{appointment.time}</Text>
            </View>
          </View>
          
          <Text style={styles.appointmentType}>{appointment.type}</Text>
          
          <View style={styles.appointmentActions}>
            <TouchableOpacity style={[styles.actionButton, styles.viewButton]}>
              <MaterialIcons name="visibility" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.completeButton]}>
              <MaterialIcons name="check" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => router.replace('/auth/welcome')}
      >
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
    marginVertical: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.grey,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTime: {
    fontSize: 14,
    color: Colors.grey,
    marginLeft: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 12,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: Colors.primary,
  },
  completeButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.tertiary,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
