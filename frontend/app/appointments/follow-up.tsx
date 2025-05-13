import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import appointmentService, { AppointmentData } from '@/src/services/appointment.service';
import doctorService from '@/src/services/doctor.service';

interface PreviousDoctor {
  id: number;
  name: string;
  specialization: string;
  imageUrl?: string;
  lastAppointmentDate: string;
  appointmentId: number;
}

export default function FollowUpAppointmentScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousDoctors, setPreviousDoctors] = useState<PreviousDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<PreviousDoctor | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1: Select doctor, 2: Schedule appointment
  
  useEffect(() => {
    loadPreviousDoctors();
  }, []);
  
  const loadPreviousDoctors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get completed appointments to find doctors the patient has seen before
      const response = await appointmentService.getCompletedAppointments();
      
      if (response.success && response.data) {
        // Create a map to ensure uniqueness of doctors
        const doctorsMap = new Map<number, PreviousDoctor>();
        
        response.data.forEach(appointment => {
          if (appointment.doctor && appointment.doctor.id) {
            // If this doctor is not in our map yet, or this appointment is more recent
            if (!doctorsMap.has(appointment.doctor.id) || 
                new Date(appointment.appointment_date) > new Date(doctorsMap.get(appointment.doctor.id)!.lastAppointmentDate)) {
              
              doctorsMap.set(appointment.doctor.id, {
                id: appointment.doctor.id,
                name: `${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}`,
                specialization: appointment.doctor.specialization,
                imageUrl: appointment.doctor.profile_image_url,
                lastAppointmentDate: appointment.appointment_date,
                appointmentId: appointment.id
              });
            }
          }
        });
        
        // Convert map values to array
        setPreviousDoctors(Array.from(doctorsMap.values()));
      } else {
        setError(response.message || 'Failed to load previous doctors');
      }
    } catch (err: any) {
      console.error('Error loading previous doctors:', err);
      setError(err?.message || 'An error occurred while loading your previous doctors');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDoctorSelect = (doctor: PreviousDoctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
    loadDoctorAvailability(doctor.id, format(date, 'yyyy-MM-dd'));
  };
  
  const loadDoctorAvailability = async (doctorId: number, dateString: string) => {
    setLoading(true);
    setTimeSlots([]);
    setSelectedTimeSlot(null);
    
    try {
      const response = await appointmentService.getDoctorAvailability(doctorId, dateString);
      
      if (response.success && response.data && response.data.available_slots) {
        setTimeSlots(response.data.available_slots);
      } else {
        Alert.alert('No Availability', 'No time slots available for this date. Please try another date.');
      }
    } catch (err: any) {
      console.error('Error loading doctor availability:', err);
      Alert.alert('Error', 'Failed to load doctor availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setDate(selectedDate);
      if (selectedDoctor) {
        loadDoctorAvailability(selectedDoctor.id, format(selectedDate, 'yyyy-MM-dd'));
      }
    }
  };
  
  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };
  
  const handleScheduleAppointment = async () => {
    if (!selectedDoctor || !selectedTimeSlot) {
      Alert.alert('Incomplete Information', 'Please select a doctor and time slot');
      return;
    }
    
    setLoading(true);
    
    try {
      const appointmentData = {
        doctor_id: selectedDoctor.id,
        appointment_date: format(date, 'yyyy-MM-dd'),
        appointment_time: selectedTimeSlot,
        appointment_type: 'follow-up',
        notes: notes,
        parent_appointment_id: selectedDoctor.appointmentId, // Link to previous appointment
      };
      
      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response.success && response.data) {
        Alert.alert(
          'Success',
          'Your follow-up appointment has been scheduled successfully',
          [{ text: 'OK', onPress: () => router.push('/appointments') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to schedule appointment');
      }
    } catch (err: any) {
      console.error('Error scheduling appointment:', err);
      Alert.alert('Error', err?.message || 'An error occurred while scheduling your appointment');
    } finally {
      setLoading(false);
    }
  };
  
  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedDoctor(null);
      setSelectedTimeSlot(null);
    } else {
      router.back();
    }
  };
  
  // Define fixed gradient colors
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;
  
  // Loading state
  if (loading && step === 1) {
    return (
      <SafeAreaView style={[styles.loadingContainer, {backgroundColor: isDarkMode ? '#151718' : '#f8f8f8'}]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading your previous doctors...</ThemedText>
      </SafeAreaView>
    );
  }
  
  // Error state
  if (error && step === 1) {
    return (
      <SafeAreaView style={[styles.errorContainer, {backgroundColor: isDarkMode ? '#151718' : '#f8f8f8'}]}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={[styles.retryButton, {backgroundColor: isDarkMode ? '#1D3D47' : '#0a7ea4'}]} 
          onPress={loadPreviousDoctors}
        >
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: step === 1 ? 'Follow-up Appointment' : 'Schedule Appointment',
          headerLeft: () => (
            <TouchableOpacity onPress={goBack} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
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
        {step === 1 ? (
          // Step 1: Select Doctor
          <View style={styles.content}>
            <ThemedText style={styles.headerText}>
              Select a doctor for your follow-up appointment
            </ThemedText>
            
            <ThemedText style={styles.subHeaderText}>
              These are doctors you've had appointments with in the past
            </ThemedText>
            
            {previousDoctors.length === 0 ? (
              <ThemedView style={styles.emptyStateContainer}>
                <Ionicons name="medical" size={60} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} style={{ opacity: 0.5 }} />
                <ThemedText style={styles.emptyStateText}>
                  You haven't had any appointments yet.
                </ThemedText>
                <TouchableOpacity
                  style={[styles.newAppointmentButton, { backgroundColor: isDarkMode ? '#1D3D47' : '#0a7ea4' }]}
                  onPress={() => router.push('/new-appointment')}
                >
                  <ThemedText style={styles.newAppointmentButtonText}>
                    Book Your First Appointment
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ) : (
              previousDoctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={[
                    styles.doctorCard,
                    { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                  ]}
                  onPress={() => handleDoctorSelect(doctor)}
                >
                  <View style={styles.doctorInfo}>
                    <View style={styles.doctorAvatarContainer}>
                      <LinearGradient
                        colors={isDarkMode ? headerGradientDark : headerGradientLight}
                        style={styles.doctorAvatar}
                      >
                        <Ionicons name="person" size={30} color="#fff" />
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.doctorDetails}>
                      <ThemedText style={styles.doctorName}>Dr. {doctor.name}</ThemedText>
                      <View style={styles.specialtyContainer}>
                        <FontAwesome5 name="stethoscope" size={12} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
                        <ThemedText style={styles.specialtyText}>{doctor.specialization}</ThemedText>
                      </View>
                      <ThemedText style={styles.lastAppointment}>
                        Last appointment: {new Date(doctor.lastAppointmentDate).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.selectIconContainer}>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={isDarkMode ? '#A1CEDC' : '#0a7ea4'}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          // Step 2: Schedule Appointment
          <View style={styles.content}>
            {selectedDoctor && (
              <>
                <ThemedView 
                  style={[
                    styles.selectedDoctorCard, 
                    { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                  ]}
                >
                  <View style={styles.doctorInfo}>
                    <View style={styles.doctorAvatarContainer}>
                      <LinearGradient
                        colors={isDarkMode ? headerGradientDark : headerGradientLight}
                        style={styles.doctorAvatar}
                      >
                        <Ionicons name="person" size={30} color="#fff" />
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.doctorDetails}>
                      <ThemedText style={styles.doctorName}>Dr. {selectedDoctor.name}</ThemedText>
                      <ThemedText style={styles.specialtyText}>{selectedDoctor.specialization}</ThemedText>
                    </View>
                  </View>
                </ThemedView>
                
                <ThemedView style={[
                  styles.sectionCard,
                  { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                ]}>
                  <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
                  
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      { backgroundColor: isDarkMode ? '#1D3D47' : '#E9F5F9' }
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar"
                      size={24}
                      color={isDarkMode ? '#A1CEDC' : '#0a7ea4'}
                      style={styles.datePickerIcon}
                    />
                    <ThemedText style={styles.datePickerText}>
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </ThemedText>
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </ThemedView>
                
                <ThemedView style={[
                  styles.sectionCard,
                  { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                ]}>
                  <ThemedText style={styles.sectionTitle}>Select Time</ThemedText>
                  
                  {loading ? (
                    <ActivityIndicator size="small" color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
                  ) : timeSlots.length === 0 ? (
                    <ThemedText style={styles.noTimeSlotsText}>
                      No time slots available for this date. Please try another date.
                    </ThemedText>
                  ) : (
                    <View style={styles.timeSlotsContainer}>
                      {timeSlots.map((timeSlot) => {
                        const [hours, minutes] = timeSlot.split(':');
                        const hour = parseInt(hours, 10);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const formattedHour = hour % 12 || 12;
                        const formattedTime = `${formattedHour}:${minutes} ${ampm}`;
                        
                        return (
                          <TouchableOpacity
                            key={timeSlot}
                            style={[
                              styles.timeSlotButton,
                              { 
                                backgroundColor: selectedTimeSlot === timeSlot 
                                  ? (isDarkMode ? '#1D3D47' : '#0a7ea4') 
                                  : (isDarkMode ? '#2A3B40' : '#E9F5F9') 
                              }
                            ]}
                            onPress={() => handleTimeSlotSelect(timeSlot)}
                          >
                            <ThemedText 
                              style={[
                                styles.timeSlotText,
                                selectedTimeSlot === timeSlot && { color: '#fff' }
                              ]}
                            >
                              {formattedTime}
                            </ThemedText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </ThemedView>
                
                <ThemedView style={[
                  styles.sectionCard,
                  { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                ]}>
                  <ThemedText style={styles.sectionTitle}>Notes (Optional)</ThemedText>
                  
                  <TextInput
                    style={[
                      styles.notesInput,
                      { 
                        backgroundColor: isDarkMode ? '#2A3B40' : '#E9F5F9',
                        color: isDarkMode ? '#fff' : '#000'
                      }
                    ]}
                    placeholder="Add any notes for the doctor..."
                    placeholderTextColor={isDarkMode ? '#AAA' : '#888'}
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                  />
                </ThemedView>
                
                <TouchableOpacity
                  style={[
                    styles.scheduleButton,
                    {
                      backgroundColor: selectedTimeSlot ? '#0a7ea4' : '#aad4e0',
                      opacity: selectedTimeSlot ? 1 : 0.7
                    }
                  ]}
                  onPress={handleScheduleAppointment}
                  disabled={!selectedTimeSlot || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <ThemedText style={styles.scheduleButtonText}>
                        Schedule Follow-up Appointment
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
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
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyStateContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
    opacity: 0.7,
  },
  newAppointmentButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  newAppointmentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  specialtyText: {
    fontSize: 14,
    marginLeft: 5,
    opacity: 0.8,
  },
  lastAppointment: {
    fontSize: 13,
    opacity: 0.7,
  },
  selectIconContainer: {
    width: 24,
  },
  selectedDoctorCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  datePickerIcon: {
    marginRight: 10,
  },
  datePickerText: {
    fontSize: 16,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  timeSlotButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noTimeSlotsText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
    marginVertical: 10,
  },
  notesInput: {
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
});
