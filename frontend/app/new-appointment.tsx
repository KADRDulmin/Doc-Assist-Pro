import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  View, 
  Text, 
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

import { Colors } from '@/constants/Colors';
import appointmentService, { NewAppointment } from '@/src/services/appointment.service';
import doctorService, { DoctorData } from '@/src/services/doctor.service';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NewAppointmentScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get pre-filled data from params if coming from symptom analysis
  const doctorIdFromParams = params.doctorId ? String(params.doctorId) : undefined;
  const symptomsFromParams = params.symptoms ? String(params.symptoms) : '';
  const possibleIllness1FromParams = params.possibleIllness1 ? String(params.possibleIllness1) : '';
  const possibleIllness2FromParams = params.possibleIllness2 ? String(params.possibleIllness2) : '';
  const recommendedSpecialty1FromParams = params.recommendedSpecialty1 ? String(params.recommendedSpecialty1) : '';
  const recommendedSpecialty2FromParams = params.recommendedSpecialty2 ? String(params.recommendedSpecialty2) : '';
  const criticalityFromParams = params.criticality ? String(params.criticality) : '';
  const explanationFromParams = params.explanation ? String(params.explanation) : '';
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState(doctorIdFromParams || '');
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>([
    'General Consultation',
    'Follow-up',
    'Check-up',
    'Emergency'
  ]);
  
  const [appointmentType, setAppointmentType] = useState('General Consultation');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState(
    explanationFromParams ? `Additional notes based on symptom analysis: ${explanationFromParams}` : ''
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for symptom analysis fields
  const [hasSymptomAnalysis, setHasSymptomAnalysis] = useState(!!symptomsFromParams);
  const [symptoms, setSymptoms] = useState(symptomsFromParams);
  const [possibleIllness1, setPossibleIllness1] = useState(possibleIllness1FromParams);
  const [possibleIllness2, setPossibleIllness2] = useState(possibleIllness2FromParams);
  const [recommendedSpecialty1, setRecommendedSpecialty1] = useState(recommendedSpecialty1FromParams);
  const [recommendedSpecialty2, setRecommendedSpecialty2] = useState(recommendedSpecialty2FromParams);
  const [criticality, setCriticality] = useState(criticalityFromParams);

  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  // Fetch doctors on mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Load available times when doctor or date changes
  useEffect(() => {
    if (selectedDoctor) {
      loadAvailableTimes();
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorService.getAllDoctors();
      if (response.success) {
        setDoctors(response.data);
        
        // If symptom analysis has recommended specialists, try to select a matching doctor
        if (recommendedSpecialty1 && !selectedDoctor) {
          const matchingDoctor = response.data.find(doctor => 
            doctor.specialization?.toLowerCase().includes(recommendedSpecialty1.toLowerCase()) ||
            doctor.specialization?.toLowerCase().includes(recommendedSpecialty2.toLowerCase())
          );
          
          if (matchingDoctor) {
            setSelectedDoctor(String(matchingDoctor.id));
          }
        }
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTimes = async () => {
    if (!selectedDoctor) return;

    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await appointmentService.getDoctorAvailability(Number(selectedDoctor), formattedDate);
      
      if (response.success) {
        setAvailableTimes(response.data.available_slots);
        // Reset selected time if it's not available
        if (selectedTime && !response.data.available_slots.includes(selectedTime)) {
          setSelectedTime('');
        }
      }
    } catch (error) {
      console.error('Error loading available times:', error);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!selectedDoctor) {
      Alert.alert('Error', 'Please select a doctor');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time');
      return;
    }

    setSubmitting(true);
    
    try {
      // Format date and time for submission
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Create appointment data
      const appointmentData: NewAppointment = {
        doctor_id: Number(selectedDoctor),
        appointment_date: formattedDate,
        appointment_time: selectedTime,
        appointment_type: appointmentType,
        notes,
        location: 'Main Clinic', // Default location
      };
      
      // Add symptom analysis data if available
      if (hasSymptomAnalysis) {
        Object.assign(appointmentData, {
          symptoms,
          possible_illness_1: possibleIllness1,
          possible_illness_2: possibleIllness2,
          recommended_doctor_speciality_1: recommendedSpecialty1,
          recommended_doctor_speciality_2: recommendedSpecialty2,
          criticality
        });
      }
      
      // Submit the appointment
      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          'Your appointment has been scheduled successfully',
          [
            { 
              text: 'View Appointments', 
              onPress: () => router.push('/(tabs)/appointments') 
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      Alert.alert('Error', 'An unexpected error occurred while scheduling your appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get doctor name from ID
  const getDoctorName = (doctorId: string | number) => {
    const doctor = doctors.find(doc => doc.id === Number(doctorId));
    if (!doctor) return '';
    return `Dr. ${doctor.user?.first_name} ${doctor.user?.last_name}`;
  };

  // Get criticality color
  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'High': return '#F44336';
      case 'Emergency': return '#B71C1C';
      default: return '#9E9E9E';
    }
  };

  // Determine if the appointment is emergent based on criticality
  useEffect(() => {
    if (criticality === 'High' || criticality === 'Emergency') {
      setAppointmentType('Emergency');
    }
  }, [criticality]);

  // Get safe color for activity indicator
  const activityIndicatorColor = isDarkMode ? '#A1CEDC' : '#0a7ea4';

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={activityIndicatorColor} />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? headerGradientDark : headerGradientLight}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Schedule Appointment</ThemedText>
          <View style={{width: 24}} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Symptom Analysis Summary (if available) */}
        {hasSymptomAnalysis && (
          <View style={styles.analysisSection}>
            <View style={styles.analysisSectionHeader}>
              <Ionicons name="analytics-outline" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.analysisSectionTitle}>Symptom Analysis</ThemedText>
            </View>
            
            <View style={styles.analysisSummary}>
              {criticality && (
                <View style={[
                  styles.criticalityBadge, 
                  {backgroundColor: getCriticalityColor(criticality)}
                ]}>
                  <Text style={styles.criticalityBadgeText}>{criticality} Priority</Text>
                </View>
              )}
              
              <View style={styles.analysisRow}>
                <ThemedText style={styles.analysisLabel}>Possible Conditions:</ThemedText>
                <ThemedText style={styles.analysisValue}>
                  {possibleIllness1}{possibleIllness2 ? `, ${possibleIllness2}` : ''}
                </ThemedText>
              </View>
              
              <View style={styles.analysisRow}>
                <ThemedText style={styles.analysisLabel}>Recommended Specialists:</ThemedText>
                <ThemedText style={styles.analysisValue}>
                  {recommendedSpecialty1}{recommendedSpecialty2 ? `, ${recommendedSpecialty2}` : ''}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Doctor Selection */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionTitle}>Select Doctor</ThemedText>
          <View style={[
            styles.pickerContainer,
            isDarkMode && styles.pickerContainerDark
          ]}>
            <Picker
              selectedValue={selectedDoctor}
              onValueChange={(itemValue) => setSelectedDoctor(itemValue)}
              style={styles.picker}
              itemStyle={isDarkMode ? styles.pickerItemDark : styles.pickerItem}
              dropdownIconColor={isDarkMode ? '#A1CEDC' : '#0a7ea4'}
            >
              <Picker.Item label="Select a doctor..." value="" color={isDarkMode ? '#A1CEDC' : '#000'} />
              {doctors.map(doctor => (
                <Picker.Item
                  key={doctor.id}
                  label={`Dr. ${doctor.user?.first_name} ${doctor.user?.last_name} (${doctor.specialization})`}
                  value={doctor.id.toString()}
                  color={isDarkMode ? '#A1CEDC' : '#000'}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Appointment Type */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionTitle}>Appointment Type</ThemedText>
          <View style={[
            styles.pickerContainer,
            isDarkMode && styles.pickerContainerDark
          ]}>
            <Picker
              selectedValue={appointmentType}
              onValueChange={(itemValue) => setAppointmentType(itemValue)}
              style={styles.picker}
              itemStyle={isDarkMode ? styles.pickerItemDark : styles.pickerItem}
              dropdownIconColor={isDarkMode ? '#A1CEDC' : '#0a7ea4'}
            >
              {appointmentTypes.map((type, index) => (
                <Picker.Item key={index} label={type} value={type} color={isDarkMode ? '#A1CEDC' : '#000'} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionTitle}>Date</ThemedText>
          <TouchableOpacity 
            style={[
              styles.datePickerButton,
              isDarkMode && styles.datePickerButtonDark
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.dateText}>{formatDate(selectedDate)}</ThemedText>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionTitle}>Available Time Slots</ThemedText>
          
          {availableTimes.length === 0 ? (
            <ThemedText style={styles.noSlotsText}>
              No available slots for this date. Please select another date.
            </ThemedText>
          ) : (
            <View style={styles.timeSlotContainer}>
              {availableTimes.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.selectedTimeSlot,
                    isDarkMode && selectedTime === time && styles.selectedTimeSlotDark
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text 
                    style={[
                      styles.timeSlotText,
                      selectedTime === time && styles.selectedTimeSlotText
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
          <TextInput
            style={[
              styles.notesInput,
              isDarkMode && styles.notesInputDark
            ]}
            multiline
            numberOfLines={4}
            placeholder="Additional notes for the doctor..."
            placeholderTextColor={isDarkMode ? '#78909c' : '#90a4ae'}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedDoctor || !selectedTime) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!selectedDoctor || !selectedTime || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Schedule Appointment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerContainerDark: {
    borderColor: '#34495e',
    backgroundColor: '#2c3e50',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
  },
  pickerItemDark: {
    fontSize: 16,
    color: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  datePickerButtonDark: {
    borderColor: '#34495e',
    backgroundColor: '#2c3e50',
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    paddingHorizontal: 15,
    margin: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  selectedTimeSlot: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  selectedTimeSlotDark: {
    backgroundColor: '#A1CEDC',
    borderColor: '#A1CEDC',
  },
  timeSlotText: {
    fontSize: 14,
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: '500',
  },
  noSlotsText: {
    textAlign: 'center',
    opacity: 0.7,
    marginVertical: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  notesInputDark: {
    borderColor: '#34495e',
    backgroundColor: '#2c3e50',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Symptom Analysis styles
  analysisSection: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
  },
  analysisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  analysisSummary: {
    marginBottom: 10,
  },
  criticalityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  criticalityBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  analysisRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  analysisLabel: {
    fontWeight: '600',
    marginRight: 5,
    fontSize: 14,
  },
  analysisValue: {
    flex: 1,
    fontSize: 14,
  },
});