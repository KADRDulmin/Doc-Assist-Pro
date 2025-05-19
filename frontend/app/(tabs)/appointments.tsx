import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import appointmentService, { AppointmentData } from '@/src/services/appointment.service';

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'missed'>('upcoming');
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  // Function to load appointments from API
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.getMyAppointments();
      if (response.success) {
        setAppointments(response.data);
      } else {
        setError(response.message || 'Failed to load appointments');
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err?.message || 'An error occurred while loading your appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Function to cancel an appointment
  const handleCancelAppointment = async (appointmentId: number) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await appointmentService.cancelAppointment(appointmentId);
              if (response.success) {
                // Update the local state with the cancelled appointment
                setAppointments(prevAppointments => 
                  prevAppointments.map(app => 
                    app.id === appointmentId 
                      ? { ...app, status: 'cancelled' } 
                      : app
                  )
                );
                Alert.alert('Success', 'Appointment cancelled successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel appointment');
              }
            } catch (err: any) {
              console.error('Error cancelling appointment:', err);
              Alert.alert('Error', err?.message || 'An error occurred while cancelling the appointment');
            }
          }
        }
      ]
    );
  };
  // Filter appointments based on active tab and date
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointment_date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    const isFutureAppointment = appointmentDate >= currentDate;

    switch (activeTab) {
      case 'upcoming':
        return isFutureAppointment && appointment.status === 'upcoming';
      case 'missed':
        return appointment.status === 'missed';
      default: // 'past'
        return appointment.status === 'completed' || appointment.status === 'cancelled';
    }
  });

  // Sort appointments by date
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.appointment_date);
    const dateB = new Date(b.appointment_date);
    return activeTab === 'upcoming' 
      ? dateA.getTime() - dateB.getTime()  // Show nearest first for upcoming
      : dateB.getTime() - dateA.getTime(); // Show most recent first for others
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (appointmentDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return appointmentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  // Get safe colors for text
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';

  const renderAppointmentItem = ({ item }: { item: AppointmentData }) => (
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
              : item.status === 'missed'
                ? styles.statusIndicatorMissed
                : styles.statusIndicatorCancelled
        } />
        <ThemedText style={styles.appointmentStatus}>
          {item.status === 'upcoming' ? 'Upcoming' : 
           item.status === 'completed' ? 'Completed' : 
           item.status === 'missed' ? 'Missed' : 'Cancelled'}
        </ThemedText>
      </View>
      
      <View style={styles.appointmentCardBody}>
        <View style={styles.doctorAvatarContainer}>
          <Ionicons name="person-circle" size={50} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        </View>
        
        <View style={styles.appointmentDetails}>
          <ThemedText style={styles.doctorName}>
            {item.doctor ? `Dr. ${item.doctor.user.first_name} ${item.doctor.user.last_name}` : 'Doctor'}
          </ThemedText>
          <ThemedText style={styles.doctorSpecialty}>
            {item.doctor?.specialization || 'Specialist'}
          </ThemedText>
          
          <View style={styles.appointmentInfoContainer}>
            <View style={styles.appointmentInfoItem}>
              <Ionicons name="calendar" size={16} color={textColor} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.appointmentInfoText}>
                {formatDate(item.appointment_date)}
              </ThemedText>
            </View>
            
            <View style={styles.appointmentInfoItem}>
              <Ionicons name="time" size={16} color={textColor} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.appointmentInfoText}>
                {formatTime(item.appointment_time)}
              </ThemedText>
            </View>
          </View>
          
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={textColor} style={{ opacity: 0.6 }} />
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
              <Ionicons name="calendar" size={16} color={textColor} />
              <ThemedText style={styles.footerButtonText}>Reschedule</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.footerButton, styles.cancelButton]}
              onPress={() => handleCancelAppointment(item.id)}
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
        
        {item.status === 'missed' && (
          <TouchableOpacity 
            style={[styles.footerButton, styles.rescheduleButton]}
            onPress={() => router.push(`/appointments/${item.id}/reschedule`)}
          >
            <Ionicons name="calendar" size={16} color={textColor} />
            <ThemedText style={styles.footerButtonText}>Reschedule</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading appointments...</ThemedText>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadAppointments}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
            style={[styles.tab, activeTab === 'missed' && styles.activeTab]}
            onPress={() => setActiveTab('missed')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'missed' && styles.activeTabText]}>
              Missed
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
        data={sortedAppointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4']}
            tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'}
          />
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={60} 
              color={textColor} 
              style={{ opacity: 0.3 }}
            />
            <ThemedText style={styles.emptyText}>
              No {activeTab === 'upcoming' ? 'upcoming' : activeTab === 'missed' ? 'missed' : 'past'} appointments
            </ThemedText>
            {(activeTab === 'upcoming' || activeTab === 'missed') && (
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  statusIndicatorMissed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFC107',
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