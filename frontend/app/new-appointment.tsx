import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import appointmentService, { NewAppointment } from '@/src/services/appointment.service';
import doctorService from '@/src/services/doctor.service';

// Doctor data type definition
interface Doctor {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  specialization: string;
}

// Appointment type options
const appointmentTypes = [
  { id: 'general', label: 'General Check-up' },
  { id: 'follow_up', label: 'Follow-up' },
  { id: 'consultation', label: 'Consultation' },
  { id: 'emergency', label: 'Emergency' }
];

// Time slot options (9 AM - 5 PM)
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function NewAppointmentScreen() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDoctorSelector, setShowDoctorSelector] = useState(false);

  // Fetch doctors when component mounts
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Function to fetch available doctors
  const fetchDoctors = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await doctorService.getAllDoctors();
      
      if (response.success && response.data) {
        setDoctors(response.data);
      } else {
        setError('Failed to load doctors');
      }
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError(err?.message || 'An error occurred while fetching doctors');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  // Handle appointment scheduling
  const handleScheduleAppointment = async () => {
    // Validate form
    if (!selectedDoctor) {
      Alert.alert('Error', 'Please select a doctor');
      return;
    }
    
    if (!appointmentType) {
      Alert.alert('Error', 'Please select an appointment type');
      return;
    }
    
    if (!appointmentTime) {
      Alert.alert('Error', 'Please select an appointment time');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare appointment data
      const appointmentData: NewAppointment = {
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        appointment_time: appointmentTime,
        appointment_type: appointmentType,
        location: location || undefined,
        notes: notes || undefined
      };
      
      // Submit the appointment
      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Appointment scheduled successfully!',
          [{ text: 'OK', onPress: () => router.push('/appointments') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to schedule appointment');
      }
    } catch (err: any) {
      console.error('Error scheduling appointment:', err);
      Alert.alert('Error', err?.message || 'An error occurred while scheduling your appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if date is selectable (not in the past and not on weekends)
  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Don't allow dates in the past
    if (date < today) {
      return false;
    }
    
    // Don't allow weekends (0 = Sunday, 6 = Saturday)
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading doctors...</ThemedText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Schedule Appointment',
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color="#e53935" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <TouchableOpacity style={styles.retryButton} onPress={fetchDoctors}>
                  <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
            
            {/* Doctor Selection */}
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Select Doctor</ThemedText>
              
              <TouchableOpacity 
                style={styles.doctorSelector}
                onPress={() => setShowDoctorSelector(!showDoctorSelector)}
              >
                {selectedDoctor ? (
                  <View style={styles.selectedDoctor}>
                    <ThemedText style={styles.doctorName}>
                      Dr. {selectedDoctor.user.first_name} {selectedDoctor.user.last_name}
                    </ThemedText>
                    <ThemedText style={styles.doctorSpecialty}>
                      {selectedDoctor.specialization}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.placeholderText}>
                    Select a doctor
                  </ThemedText>
                )}
                <Ionicons 
                  name={showDoctorSelector ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                />
              </TouchableOpacity>
              
              {showDoctorSelector && (
                <View style={styles.doctorsList}>
                  {doctors.length === 0 ? (
                    <ThemedText style={styles.noDataText}>No doctors available</ThemedText>
                  ) : (
                    doctors.map((doctor) => (
                      <TouchableOpacity
                        key={doctor.id}
                        style={styles.doctorItem}
                        onPress={() => {
                          setSelectedDoctor(doctor);
                          setShowDoctorSelector(false);
                        }}
                      >
                        <ThemedText style={styles.doctorItemName}>
                          Dr. {doctor.user.first_name} {doctor.user.last_name}
                        </ThemedText>
                        <ThemedText style={styles.doctorItemSpecialty}>
                          {doctor.specialization}
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </ThemedView>
            
            {/* Appointment Type */}
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Appointment Type</ThemedText>
              
              <View style={styles.appointmentTypeContainer}>
                {appointmentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.appointmentTypeButton,
                      appointmentType === type.id && styles.selectedAppointmentType
                    ]}
                    onPress={() => setAppointmentType(type.id)}
                  >
                    <ThemedText style={[
                      styles.appointmentTypeText,
                      appointmentType === type.id && styles.selectedAppointmentTypeText
                    ]}>
                      {type.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedView>
            
            {/* Date Selection */}
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Appointment Date</ThemedText>
              
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText>{formatDate(appointmentDate)}</ThemedText>
                <Ionicons name="calendar" size={20} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              <ThemedText style={styles.helpText}>
                Note: Appointments are not available on weekends
              </ThemedText>
            </ThemedView>
            
            {/* Time Selection */}
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Appointment Time</ThemedText>
              
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeSlotContainer}
              >
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlotButton,
                      appointmentTime === time && styles.selectedTimeSlot
                    ]}
                    onPress={() => setAppointmentTime(time)}
                  >
                    <ThemedText style={[
                      styles.timeSlotText,
                      appointmentTime === time && styles.selectedTimeSlotText
                    ]}>
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ThemedView>
            
            {/* Location and Notes */}
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Additional Information</ThemedText>
              
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Location (Optional)</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter location"
                  placeholderTextColor="#888"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Notes (Optional)</ThemedText>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional information for the doctor"
                  placeholderTextColor="#888"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ThemedView>
            
            {/* Submit Button */}
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={handleScheduleAppointment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="calendar-check" size={20} color="#fff" />
                  <ThemedText style={styles.scheduleButtonText}>
                    Schedule Appointment
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    marginHorizontal: 10,
    color: '#e53935',
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  doctorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  selectedDoctor: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
  },
  doctorSpecialty: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  placeholderText: {
    opacity: 0.5,
  },
  doctorsList: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    maxHeight: 200,
  },
  doctorItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  doctorItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  doctorItemSpecialty: {
    fontSize: 12,
    opacity: 0.7,
  },
  noDataText: {
    padding: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  appointmentTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  appointmentTypeButton: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
  },
  selectedAppointmentType: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  appointmentTypeText: {
    fontSize: 14,
  },
  selectedAppointmentTypeText: {
    color: '#fff',
    fontWeight: '500',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  helpText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    fontStyle: 'italic',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timeSlotButton: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  selectedTimeSlot: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  timeSlotText: {
    fontSize: 14,
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scheduleButton: {
    flexDirection: 'row',
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});