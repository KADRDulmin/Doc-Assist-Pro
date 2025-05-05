import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import appointmentService, { AppointmentData } from '@/src/services/appointment.service';

export default function AppointmentDetailsScreen() {
  const params = useLocalSearchParams();
  const appointmentId = typeof params.id === 'string' ? parseInt(params.id) : 0;
  
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentDetails();
    } else {
      setError('Invalid appointment ID');
      setLoading(false);
    }
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentService.getAppointmentById(appointmentId);
      
      if (response.success && response.data) {
        setAppointment(response.data);
      } else {
        setError(response.message || 'Failed to load appointment details');
      }
    } catch (err: any) {
      console.error('Error loading appointment details:', err);
      setError(err?.message || 'An error occurred while loading the appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
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
                // Update the local state with the updated appointment
                setAppointment(response.data);
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

  // Format date for display (e.g., "Monday, May 15, 2023")
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format time from "HH:MM:SS" to "HH:MM AM/PM"
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Get status styles
  const getStatusStyles = () => {
    if (!appointment) return {};
    
    switch (appointment.status) {
      case 'upcoming':
        return {
          color: '#4CAF50',
          backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)'
        };
      case 'completed':
        return {
          color: '#2196F3',
          backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)'
        };
      case 'cancelled':
        return {
          color: '#FF5252',
          backgroundColor: isDarkMode ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 82, 82, 0.1)'
        };
      case 'missed':
        return {
          color: '#FF9800',
          backgroundColor: isDarkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)'
        };
      default:
        return {};
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, {backgroundColor: isDarkMode ? '#151718' : '#f8f8f8'}]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading appointment details...</ThemedText>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, {backgroundColor: isDarkMode ? '#151718' : '#f8f8f8'}]}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={[styles.retryButton, {backgroundColor: isDarkMode ? '#1D3D47' : '#0a7ea4'}]} 
          onPress={loadAppointmentDetails}
        >
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={[styles.errorContainer, {backgroundColor: isDarkMode ? '#151718' : '#f8f8f8'}]}>
        <Ionicons name="calendar-outline" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>Appointment not found</ThemedText>
        <TouchableOpacity 
          style={[styles.retryButton, {backgroundColor: isDarkMode ? '#1D3D47' : '#0a7ea4'}]} 
          onPress={() => router.back()}
        >
          <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Define fixed gradient colors for header
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  const statusStyles = getStatusStyles();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Appointment Details',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1D3D47' : '#A1CEDC',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={[styles.container, {backgroundColor: isDarkMode ? '#151718' : '#f8f8f8'}]}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusBadge, 
                { backgroundColor: statusStyles.backgroundColor }
              ]}
            >
              <ThemedText 
                style={[
                  styles.statusText, 
                  { color: statusStyles.color }
                ]}
              >
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </ThemedText>
            </View>
          </View>

          {/* Doctor Information */}
          <ThemedView style={[
            styles.doctorCard, 
            {borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
          ]}>
            <View style={styles.doctorAvatarContainer}>
              <LinearGradient
                colors={isDarkMode ? headerGradientDark : headerGradientLight}
                style={styles.doctorAvatar}
              >
                <Ionicons name="person" size={40} color="#fff" />
              </LinearGradient>
            </View>
            
            <View style={styles.doctorInfo}>
              <ThemedText style={styles.doctorName}>
                {appointment.doctor 
                  ? `Dr. ${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}`
                  : 'Doctor'
                }
              </ThemedText>
              <ThemedText style={[styles.doctorSpecialty, {opacity: isDarkMode ? 0.8 : 0.7}]}>
                {appointment.doctor?.specialization || 'Specialist'}
              </ThemedText>
            </View>
          </ThemedView>

          {/* Appointment Details */}
          <ThemedView style={[
            styles.detailsCard,
            {borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
          ]}>
            <ThemedText style={styles.sectionTitle}>Appointment Details</ThemedText>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar" size={24} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              </View>
              <View>
                <ThemedText style={[styles.detailLabel, {opacity: isDarkMode ? 0.7 : 0.6}]}>Date</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(appointment.appointment_date)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={24} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              </View>
              <View>
                <ThemedText style={[styles.detailLabel, {opacity: isDarkMode ? 0.7 : 0.6}]}>Time</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatTime(appointment.appointment_time)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="medical" size={24} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              </View>
              <View>
                <ThemedText style={[styles.detailLabel, {opacity: isDarkMode ? 0.7 : 0.6}]}>Type</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {appointment.appointment_type
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                  }
                </ThemedText>
              </View>
            </View>
            
            {appointment.location && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location" size={24} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
                </View>
                <View>
                  <ThemedText style={[styles.detailLabel, {opacity: isDarkMode ? 0.7 : 0.6}]}>Location</ThemedText>
                  <ThemedText style={styles.detailValue}>{appointment.location}</ThemedText>
                </View>
              </View>
            )}
          </ThemedView>

          {/* Notes Section */}
          {appointment.notes && (
            <ThemedView style={[
              styles.detailsCard,
              {borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
            ]}>
              <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
              <ThemedText style={styles.notesContent}>{appointment.notes}</ThemedText>
            </ThemedView>
          )}

          {/* Action Buttons */}
          {appointment.status === 'upcoming' && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rescheduleButton]}
                onPress={() => router.push(`/appointments/${appointmentId}/reschedule`)}
              >
                <Ionicons name="calendar" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Reschedule</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelAppointment}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Leave Feedback Button for completed appointments */}
          {appointment.status === 'completed' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.feedbackButton]}
                onPress={() => router.push(`/feedback/${appointmentId}`)}
              >
                <Ionicons name="star" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Leave Feedback</ThemedText>
              </TouchableOpacity>
              
              {/* Medical Records Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.medicalRecordsButton]}
                onPress={() => router.push(`/appointments/${appointmentId}/medical-records`)}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Medical Records</ThemedText>
              </TouchableOpacity>
              
              {/* Prescriptions Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.prescriptionsButton]}
                onPress={() => router.push(`/appointments/${appointmentId}/prescriptions`)}
              >
                <Ionicons name="medical" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Prescriptions</ThemedText>
              </TouchableOpacity>
            </>
          )}

          {/* Contact Doctor Button */}
          {appointment.doctor && (
            <TouchableOpacity
              style={[styles.actionButton, styles.contactButton]}
              onPress={() => router.push(`/doctors/${appointment.doctor?.id}`)}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Contact Doctor</ThemedText>
            </TouchableOpacity>
          )}
          
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: '600',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  doctorAvatarContainer: {
    marginRight: 15,
  },
  doctorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  doctorSpecialty: {
    fontSize: 14,
    opacity: 0.7,
  },
  detailsCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  detailIconContainer: {
    width: 40,
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  rescheduleButton: {
    backgroundColor: '#2196F3',
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    flex: 1,
    marginLeft: 10,
  },
  feedbackButton: {
    backgroundColor: '#FFC107',
    width: '100%',
  },
  medicalRecordsButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    marginTop: 15,
  },
  prescriptionsButton: {
    backgroundColor: '#9C27B0',
    width: '100%',
    marginTop: 15,
  },
  contactButton: {
    backgroundColor: '#0a7ea4',
    width: '100%',
    marginTop: 15,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
});