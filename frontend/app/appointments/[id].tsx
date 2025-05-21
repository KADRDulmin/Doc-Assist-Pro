import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import appointmentService, { AppointmentData } from '@/src/services/appointment.service';
import doctorService from '@/src/services/doctor.service';

export default function AppointmentDetailsScreen() {
  const params = useLocalSearchParams();
  const appointmentId = typeof params.id === 'string' ? parseInt(params.id) : 0;
  
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorAddress, setDoctorAddress] = useState<string | null>(null);

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
        
        // Fetch doctor details to get address
        if (response.data.doctor?.id) {
          try {
            const doctorResponse = await doctorService.getDoctorById(response.data.doctor.id);
            if (doctorResponse.success && doctorResponse.data) {
              setDoctorAddress(doctorResponse.data.address || null);
            }
          } catch (doctorErr) {
            console.error('Error loading doctor address:', doctorErr);
            // We don't show an error for this as it's not critical
          }
        }
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
  // Function to open Google Maps with directions to the clinic
  const handleNavigateToClinic = () => {
    const locationToUse = appointment?.location || doctorAddress;
    
    if (!locationToUse) {
      Alert.alert('Error', 'No location information available for this appointment');
      return;
    }

    const destination = encodeURIComponent(locationToUse);
    const url = Platform.select({
      ios: `maps://app?daddr=${destination}&dirflg=d`,
      android: `google.navigation:q=${destination}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to web URL if the app-specific URL fails
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`);
      }
    }).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
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
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={[styles.container, {backgroundColor: isDarkMode ? '#121212' : '#F5F7FA'}]}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <LinearGradient
              colors={[
                statusStyles.color + '40', // Adding 40 for 25% opacity
                statusStyles.color + '20'  // Adding 20 for 12% opacity
              ]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.statusBadge}
            >
              <Ionicons 
                name={
                  appointment.status === 'upcoming' ? 'time-outline' : 
                  appointment.status === 'completed' ? 'checkmark-circle-outline' :
                  appointment.status === 'cancelled' ? 'close-circle-outline' : 'alert-circle-outline'
                } 
                size={18} 
                color={statusStyles.color} 
                style={{marginRight: 8}}
              />
              <ThemedText 
                style={[
                  styles.statusText, 
                  { color: statusStyles.color }
                ]}
              >
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </ThemedText>
            </LinearGradient>
          </View>          {/* Doctor Information */}
          <ThemedView style={[
            styles.doctorCard, 
            {
              backgroundColor: isDarkMode ? '#1D2939' : '#fff',
              shadowColor: isDarkMode ? '#000' : '#2C3E50',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: isDarkMode ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4
            }
          ]}>
            <View style={styles.doctorAvatarContainer}>
              <LinearGradient
                colors={isDarkMode ? ['#2E78B7', '#144272'] : ['#3498DB', '#2980B9']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.doctorAvatar}
              >
                <Ionicons name="person" size={32} color="#fff" />
              </LinearGradient>
            </View>
            
            <View style={styles.doctorInfo}>
              <ThemedText style={styles.doctorName}>
                {appointment.doctor 
                  ? `Dr. ${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}`
                  : 'Doctor'
                }
              </ThemedText>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                <Ionicons name="medical" size={14} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} style={{marginRight: 6}} />
                <ThemedText style={styles.doctorSpecialty}>
                  {appointment.doctor?.specialization || 'Specialist'}
                </ThemedText>
              </View>
            </View>
            
          </ThemedView>

          {/* Appointment Details */}          <ThemedView style={[
            styles.detailsCard,
            {
              backgroundColor: isDarkMode ? '#1D2939' : '#fff',
              shadowColor: isDarkMode ? '#000' : '#2C3E50',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: isDarkMode ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4
            }
          ]}>
            <ThemedText style={styles.sectionTitle}>Appointment Details</ThemedText>
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, {
                backgroundColor: isDarkMode ? 'rgba(161, 206, 220, 0.15)' : 'rgba(10, 126, 164, 0.08)',
                borderRadius: 10
              }]}>
                <Ionicons name="calendar" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Date</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(appointment.appointment_date)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, {
                backgroundColor: isDarkMode ? 'rgba(161, 206, 220, 0.15)' : 'rgba(10, 126, 164, 0.08)',
                borderRadius: 10
              }]}>
                <Ionicons name="time" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Time</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatTime(appointment.appointment_time)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, {
                backgroundColor: isDarkMode ? 'rgba(161, 206, 220, 0.15)' : 'rgba(10, 126, 164, 0.08)',
                borderRadius: 10
              }]}>
                <Ionicons name="medical" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Type</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {appointment.appointment_type
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                  }
                </ThemedText>
              </View>
            </View>              {(appointment.location || doctorAddress) && (
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, {
                  backgroundColor: isDarkMode ? 'rgba(161, 206, 220, 0.15)' : 'rgba(10, 126, 164, 0.08)',
                  borderRadius: 10
                }]}>
                  <Ionicons name="location" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Location</ThemedText>
                  <View style={styles.locationContainer}>
                    <View style={{flex: 1, marginRight: 10}}>

                      
                      {/* Show doctor address if available */}
                      {doctorAddress && (
                        <ThemedText style={[styles.detailValue, {marginTop: appointment.location ? 4 : 0}]}>
                          {doctorAddress}
                        </ThemedText>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.locationDirectionsButton}
                      onPress={handleNavigateToClinic}
                    >
                      <LinearGradient
                        colors={isDarkMode ? ['#1D3D47', '#0f1e23'] : ['#A1CEDC', '#78b1c4']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.directionsBtnGradient}
                      >
                        <Ionicons name="navigate" size={14} color="#fff" />
                        <ThemedText style={styles.locationDirectionsText}>Directions</ThemedText>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ThemedView>          {/* Add Parent Appointment Info for follow-up appointments */}
          {appointment.parent_appointment_id && appointment.appointment_type === 'follow-up' && (
            <ThemedView style={[
              styles.detailsCard,
              {
                backgroundColor: isDarkMode ? '#1D2939' : '#fff',
                shadowColor: isDarkMode ? '#000' : '#2C3E50',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: isDarkMode ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4
              }
            ]}>
              <ThemedText style={styles.sectionTitle}>Follow-up Information</ThemedText>
              
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, {
                  backgroundColor: isDarkMode ? 'rgba(161, 206, 220, 0.15)' : 'rgba(10, 126, 164, 0.08)',
                  borderRadius: 10
                }]}>
                  <Ionicons name="git-branch" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Previous Appointment</ThemedText>
                  <TouchableOpacity 
                    onPress={() => router.push(`/appointments/${appointment.parent_appointment_id}`)}
                    style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}
                  >
                    <ThemedText style={[styles.detailValue, {color: isDarkMode ? '#A1CEDC' : '#0a7ea4'}]}>
                      View Original Appointment
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} style={{marginLeft: 4}} />
                  </TouchableOpacity>
                </View>
              </View>
            </ThemedView>
          )}          {/* Notes Section */}
          {appointment.notes && (
            <ThemedView style={[
              styles.detailsCard,
              {
                backgroundColor: isDarkMode ? '#1D2939' : '#fff',
                shadowColor: isDarkMode ? '#000' : '#2C3E50',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: isDarkMode ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4
              }
            ]}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                <Ionicons name="document-text-outline" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} style={{marginRight: 8}} />
                <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
              </View>
              <View style={{
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: 12,
                padding: 12
              }}>
                <ThemedText style={styles.notesContent}>{appointment.notes}</ThemedText>
              </View>
            </ThemedView>
          )}{/* Action Buttons */}
          {appointment.status === 'upcoming' && (
            <ThemedView style={[styles.actionsCard, {
              backgroundColor: isDarkMode ? '#1D2939' : '#fff',
              shadowColor: isDarkMode ? '#000' : '#2C3E50',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: isDarkMode ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4
            }]}>
              <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
              
              <View style={styles.actionsGrid}>
                {/* Navigate Button */}
                {appointment.location && (
                  <TouchableOpacity
                    style={styles.actionGridItem}
                    onPress={handleNavigateToClinic}
                  >
                    <LinearGradient
                      colors={['#FF9800', '#F57C00']}
                      style={styles.actionIconContainer}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                    >
                      <Ionicons name="navigate" size={22} color="#fff" />
                    </LinearGradient>
                    <ThemedText style={styles.actionGridText}>Navigate</ThemedText>
                  </TouchableOpacity>
                )}
                
                {/* Reschedule Button */}
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={() => router.push(`/appointments/${appointmentId}/reschedule`)}
                >
                  <LinearGradient
                    colors={['#2196F3', '#1976D2']}
                    style={styles.actionIconContainer}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                  >
                    <Ionicons name="calendar" size={22} color="#fff" />
                  </LinearGradient>
                  <ThemedText style={styles.actionGridText}>Reschedule</ThemedText>
                </TouchableOpacity>
                
                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={handleCancelAppointment}
                >
                  <LinearGradient
                    colors={['#FF5252', '#D32F2F']}
                    style={styles.actionIconContainer}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                  >
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </LinearGradient>
                  <ThemedText style={styles.actionGridText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}          {/* Completed appointment actions */}
          {appointment.status === 'completed' && (
            <ThemedView style={[styles.actionsCard, {
              backgroundColor: isDarkMode ? '#1D2939' : '#fff',
              shadowColor: isDarkMode ? '#000' : '#2C3E50',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: isDarkMode ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4
            }]}>
              <ThemedText style={styles.sectionTitle}>Appointment Resources</ThemedText>
              
              <View style={styles.actionsGrid}>
                {/* Feedback Button */}
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={() => router.push(`/feedback/${appointmentId}`)}
                >
                  <LinearGradient
                    colors={['#FFC107', '#FFA000']}
                    style={styles.actionIconContainer}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                  >
                    <Ionicons name="star" size={22} color="#fff" />
                  </LinearGradient>
                  <ThemedText style={styles.actionGridText}>Feedback</ThemedText>
                </TouchableOpacity>
                
                {/* Medical Records Button */}
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={() => router.push(`/appointments/${appointmentId}/medical-records`)}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#388E3C']}
                    style={styles.actionIconContainer}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                  >
                    <Ionicons name="document-text" size={22} color="#fff" />
                  </LinearGradient>
                  <ThemedText style={styles.actionGridText}>Records</ThemedText>
                </TouchableOpacity>
                
                {/* Prescriptions Button */}
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={() => router.push(`/appointments/${appointmentId}/prescriptions`)}
                >
                  <LinearGradient
                    colors={['#9C27B0', '#7B1FA2']}
                    style={styles.actionIconContainer}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                  >
                    <Ionicons name="medical" size={22} color="#fff" />
                  </LinearGradient>
                  <ThemedText style={styles.actionGridText}>Prescriptions</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}          {/* Contact Doctor Button - shown when the appointment is not cancelled */}
          {appointment.doctor && appointment.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.contactDoctorButton}
              onPress={() => {
                if (appointment.doctor?.user?.phone) {
                  // Make an actual phone call
                  const phoneNumber = appointment.doctor.user.phone.replace(/\s/g, '');
                  Linking.openURL(`tel:${phoneNumber}`);
                } else {
                  // If no phone number, redirect to doctor profile
                  router.push(`/doctors/${appointment.doctor?.id}`);
                  Alert.alert('No phone number', 'No phone number available for this doctor. Redirecting to profile.');
                }
              }}
            >
              <LinearGradient
                colors={isDarkMode ? ['#1D3D47', '#0f1e23'] : ['#0a7ea4', '#055976']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.contactBtnGradient}
              >
                <Ionicons name="call" size={20} color="#fff" style={styles.contactBtnIcon} />
                <ThemedText style={styles.contactBtnText}>Call Doctor</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    top: 50,
    flex: 1,
    marginBottom: 30,
  },
  content: {
    padding: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    minWidth: 120,
    justifyContent: 'center',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  doctorAvatarContainer: {
    marginRight: 15,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
  },
  doctorSpecialty: {
    fontSize: 14,
    opacity: 0.8,
  },
  doctorContactButton: {
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  actionsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailValueAddress: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
  },
  notesContent: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  locationDirectionsButton: {
    alignItems: 'center',
    justifyContent: 'center', 
    borderRadius: 8,
    overflow: 'hidden',
  },
  directionsBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  locationDirectionsText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#fff',
    fontWeight: '500',
  },
  // New Grid Action Styles
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionGridItem: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionGridText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Contact doctor button
  contactDoctorButton: {
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 5,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  contactBtnIcon: {
    marginRight: 10,
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});