import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Mock data interface
interface Appointment {
  id: number;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  doctorImage?: string;
  location?: string;
}

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // Mock data
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      doctorName: 'Dr. Emily Chen',
      specialty: 'Cardiology',
      date: 'Today',
      time: '10:00 AM',
      status: 'upcoming',
      location: 'Central Hospital, Floor 3'
    },
    {
      id: 2,
      doctorName: 'Dr. Michael Wong',
      specialty: 'General Medicine',
      date: 'May 15, 2025',
      time: '3:30 PM',
      status: 'upcoming',
      location: 'City Medical Center'
    },
    {
      id: 3,
      doctorName: 'Dr. Sarah Miller',
      specialty: 'Dermatology',
      date: 'April 10, 2025',
      time: '2:00 PM',
      status: 'completed',
      location: 'Dermatology Clinic'
    },
    {
      id: 4,
      doctorName: 'Dr. Robert Johnson',
      specialty: 'Orthopedics',
      date: 'March 25, 2025',
      time: '11:15 AM',
      status: 'completed',
      location: 'Sports Medicine Center'
    },
    {
      id: 5,
      doctorName: 'Dr. Jessica Lee',
      specialty: 'Neurology',
      date: 'March 15, 2025',
      time: '9:30 AM',
      status: 'cancelled',
      location: 'Neuroscience Institute'
    }
  ]);

  const filteredAppointments = appointments.filter(
    appointment => activeTab === 'upcoming' 
      ? appointment.status === 'upcoming'
      : appointment.status === 'completed' || appointment.status === 'cancelled'
  );

  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => router.push(`/appointments/${item.id}`)}
    >
      <View style={styles.appointmentCardHeader}>
        <View style={
          item.status === 'upcoming' 
            ? styles.statusIndicatorUpcoming 
            : item.status === 'completed'
              ? styles.statusIndicatorCompleted
              : styles.statusIndicatorCancelled
        } />
        <ThemedText style={styles.appointmentStatus}>
          {item.status === 'upcoming' ? 'Upcoming' : item.status === 'completed' ? 'Completed' : 'Cancelled'}
        </ThemedText>
      </View>
      
      <View style={styles.appointmentCardBody}>
        <View style={styles.doctorAvatarContainer}>
          <Ionicons name="person-circle" size={50} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        </View>
        
        <View style={styles.appointmentDetails}>
          <ThemedText style={styles.doctorName}>{item.doctorName}</ThemedText>
          <ThemedText style={styles.doctorSpecialty}>{item.specialty}</ThemedText>
          
          <View style={styles.appointmentInfoContainer}>
            <View style={styles.appointmentInfoItem}>
              <Ionicons name="calendar" size={16} color={Colors[colorScheme ?? 'light'].text} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.appointmentInfoText}>{item.date}</ThemedText>
            </View>
            
            <View style={styles.appointmentInfoItem}>
              <Ionicons name="time" size={16} color={Colors[colorScheme ?? 'light'].text} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.appointmentInfoText}>{item.time}</ThemedText>
            </View>
          </View>
          
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={Colors[colorScheme ?? 'light'].text} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.locationText}>{item.location}</ThemedText>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.appointmentCardFooter}>
        {item.status === 'upcoming' && (
          <>
            <TouchableOpacity 
              style={[styles.footerButton, styles.rescheduleButton]}
              onPress={() => router.push(`/appointments/${item.id}/reschedule`)}
            >
              <Ionicons name="calendar" size={16} color={Colors[colorScheme ?? 'light'].text} />
              <ThemedText style={styles.footerButtonText}>Reschedule</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.footerButton, styles.cancelButton]}
              onPress={() => {
                // Logic to cancel appointment
                const updatedAppointments = appointments.map(app => 
                  app.id === item.id ? { ...app, status: 'cancelled' as const } : app
                );
                setAppointments(updatedAppointments);
              }}
            >
              <Ionicons name="close-circle" size={16} color="#FF5252" />
              <ThemedText style={[styles.footerButtonText, { color: '#FF5252' }]}>Cancel</ThemedText>
            </TouchableOpacity>
          </>
        )}
        
        {item.status === 'completed' && (
          <TouchableOpacity 
            style={[styles.footerButton, styles.feedbackButton]}
            onPress={() => router.push(`/feedback/${item.id}`)}
          >
            <Ionicons name="star" size={16} color="#FFC107" />
            <ThemedText style={[styles.footerButtonText, { color: '#FFC107' }]}>Leave Feedback</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colorScheme === 'dark' ? headerGradientDark : headerGradientLight}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>My Appointments</ThemedText>
          <TouchableOpacity 
            style={styles.newButton}
            onPress={() => router.push('/new-appointment')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => setActiveTab('past')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              Past
            </ThemedText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={60} 
              color={Colors[colorScheme ?? 'light'].text} 
              style={{ opacity: 0.3 }}
            />
            <ThemedText style={styles.emptyText}>
              No {activeTab === 'upcoming' ? 'upcoming' : 'past'} appointments
            </ThemedText>
            {activeTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.scheduleButton}
                onPress={() => router.push('/new-appointment')}
              >
                <ThemedText style={styles.scheduleButtonText}>Schedule Now</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        }
      />
      
      {/* Bottom spacing for bottom tabs */}
      <View style={{ height: 70 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: '#fff',
    opacity: 0.8,
  },
  activeTabText: {
    opacity: 1,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  appointmentCard: {
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  appointmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusIndicatorUpcoming: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusIndicatorCompleted: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    marginRight: 8,
  },
  statusIndicatorCancelled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    marginRight: 8,
  },
  appointmentStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentCardBody: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  doctorAvatarContainer: {
    marginRight: 15,
  },
  appointmentDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  appointmentInfoContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  appointmentInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  appointmentInfoText: {
    fontSize: 14,
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    marginLeft: 5,
    opacity: 0.8,
  },
  appointmentCardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    padding: 10,
    justifyContent: 'flex-end',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  rescheduleButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  feedbackButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  footerButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    opacity: 0.6,
  },
  scheduleButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});