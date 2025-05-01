import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Text, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/src/hooks/useAuth';
import patientService from '@/src/services/patient.service';
import { Colors } from '@/constants/Colors';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  
  // Get params from the route
  const { 
    doctorId = '', 
    doctorName = '', 
    specialization = '',
    appointmentType = 'follow-up' 
  } = useLocalSearchParams<{ 
    doctorId: string;
    doctorName: string;
    specialization: string;
    appointmentType: string;
  }>();

  // State variables
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [reasonMenuVisible, setReasonMenuVisible] = useState(false);
  const [notes, setNotes] = useState('');

  // Predefined reasons for follow-up
  const followUpReasons = [
    'Check-up after treatment',
    'Discuss test results',
    'Medication adjustment',
    'Continuing treatment',
    'New symptoms related to previous condition',
    'Other'
  ];

  // Get today's date in yyyy-MM-dd format
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Get date 3 months from today
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Format date for display (e.g., "Monday, May 15, 2025")
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display (e.g., "10:00 AM")
  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hoursNum = parseInt(hours);
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  // Fetch available time slots for selected date
  useEffect(() => {
    if (selectedDate && doctorId) {
      fetchAvailableTimeSlots();
    }
  }, [selectedDate, doctorId]);

  const fetchAvailableTimeSlots = async () => {
    try {
      setAvailabilityLoading(true);
      
      const response = await patientService.getDoctorAvailability(Number(doctorId), selectedDate);
      
      if (response.success && response.data) {
        setAvailableTimeSlots(response.data.available_slots || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch available time slots');
        setAvailableTimeSlots([]);
      }
    } catch (err) {
      console.error('Error fetching available time slots:', err);
      Alert.alert('Error', 'An unexpected error occurred fetching time slots');
      setAvailableTimeSlots([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(''); // Reset selected time slot
  };

  // Handle time slot selection
  const handleTimeSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  // Handle reason selection
  const handleReasonSelect = (selectedReason: string) => {
    setReason(selectedReason);
    setReasonMenuVisible(false);
  };

  // Book appointment
  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !reason) {
      Alert.alert('Missing Information', 'Please select a date, time, and reason for your appointment');
      return;
    }

    try {
      setLoading(true);

      const appointmentData = {
        doctor_id: Number(doctorId),
        appointment_date: selectedDate,
        appointment_time: selectedTimeSlot,
        appointment_type: appointmentType,
        notes: `Reason: ${reason}${notes ? '\n\nAdditional notes: ' + notes : ''}`
      };

      const response = await patientService.bookAppointment(appointmentData);
      
      if (response.success && response.data) {
        Alert.alert(
          'Success',
          'Your appointment has been booked successfully',
          [
            { 
              text: 'View Appointments', 
              onPress: () => router.push('/appointments') 
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to book appointment');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      Alert.alert('Error', 'An unexpected error occurred while booking your appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.doctorCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }]}>
        <View style={styles.cardContent}>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <View style={styles.specializationContainer}>
            <FontAwesome5 
              name="stethoscope" 
              size={12} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.specializationIcon}
            />
            <Text style={styles.specialization}>{specialization}</Text>
          </View>
          <Text style={styles.appointmentType}>
            Appointment Type: {appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <Calendar
          current={todayStr}
          minDate={todayStr}
          maxDate={maxDateStr}
          onDayPress={(day) => handleDateSelect(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: Colors[colorScheme ?? 'light'].tint }
          }}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: colorScheme === 'dark' ? '#1c1c1c' : '#fff',
            textSectionTitleColor: colorScheme === 'dark' ? '#fff' : '#b6c1cd',
            textSectionTitleDisabledColor: '#d9e1e8',
            selectedDayBackgroundColor: Colors[colorScheme ?? 'light'].tint,
            selectedDayTextColor: '#fff',
            todayTextColor: Colors[colorScheme ?? 'light'].tint,
            dayTextColor: colorScheme === 'dark' ? '#fff' : '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: Colors[colorScheme ?? 'light'].tint,
            selectedDotColor: '#fff',
            arrowColor: Colors[colorScheme ?? 'light'].tint,
            disabledArrowColor: '#d9e1e8',
            monthTextColor: colorScheme === 'dark' ? '#fff' : 'black',
            indicatorColor: Colors[colorScheme ?? 'light'].tint,
          }}
        />
      </View>

      {selectedDate && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <Text style={styles.dateDisplay}>
            {formatDateForDisplay(selectedDate)}
          </Text>
          
          {availabilityLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={styles.loadingText}>Loading available time slots...</Text>
            </View>
          ) : availableTimeSlots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={30} color="#ccc" />
              <Text style={styles.emptyText}>No available time slots for this date</Text>
              <Text style={styles.emptySubText}>Please select another date</Text>
            </View>
          ) : (
            <View style={styles.timeSlotContainer}>
              {availableTimeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === time && styles.selectedTimeSlot
                  ]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text 
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot === time && styles.selectedTimeSlotText
                    ]}
                  >
                    {formatTimeForDisplay(time)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Reason for Follow-up</Text>
        
        <TouchableOpacity 
          style={styles.reasonSelector}
          onPress={() => setReasonMenuVisible(true)}
        >
          <Text style={[
            styles.reasonSelectorText,
            !reason && styles.reasonSelectorPlaceholder
          ]}>
            {reason || 'Select a reason for your follow-up'}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={colorScheme === 'dark' ? '#fff' : '#666'} 
          />
        </TouchableOpacity>
        
        <Modal
          visible={reasonMenuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setReasonMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setReasonMenuVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }]}>
              {followUpReasons.map((item) => (
                <TouchableOpacity 
                  key={item}
                  style={styles.reasonItem}
                  onPress={() => handleReasonSelect(item)}
                >
                  <Text style={styles.reasonItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.bookButton,
            (!selectedDate || !selectedTimeSlot || !reason) && styles.disabledButton
          ]}
          disabled={loading || !selectedDate || !selectedTimeSlot || !reason}
          onPress={handleBookAppointment}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Add some padding at the bottom for scrolling */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  doctorCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  cardContent: {
    padding: 16,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specializationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specializationIcon: {
    marginRight: 6,
  },
  specialization: {
    fontSize: 14,
    color: '#666',
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  sectionContainer: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.light.tint,
  },
  dateDisplay: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 15,
    color: '#555',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  timeSlot: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    margin: 4,
    minWidth: 90,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: Colors.light.tint,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#555',
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
    color: '#666',
  },
  emptySubText: {
    fontSize: 12,
    marginTop: 4,
    color: '#999',
  },
  reasonSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  reasonSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  reasonSelectorPlaceholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 8,
    padding: 16,
  },
  reasonItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  reasonItemText: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: Colors.light.tint,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});