import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Safely import DateTimePicker with error handling
let DateTimePicker;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker could not be imported:', error);
  // Fallback is provided in the component below
  DateTimePicker = null;
}

/**
 * A safe wrapper around DateTimePicker that handles native module errors
 * with an enhanced fallback that gives actual date selection functionality
 */
const SafeDateTimePicker = ({
  value,
  onChange,
  mode = 'date',
  display,
  maximumDate,
  minimumDate,
  style,
  testID,
  ...rest
}) => {
  // State for our custom fallback picker
  const [showFallbackPicker, setShowFallbackPicker] = useState(false);
  
  // For web platform
  if (Platform.OS === 'web') {
    // Web implementation (native DateTimePicker not supported)
    return (
      <input
        type={mode === 'date' ? 'date' : 'time'}
        value={
          mode === 'date'
            ? value.toISOString().split('T')[0]
            : value.toISOString().split('T')[1].split('.')[0]
        }
        onChange={(e) => {
          const newDate = new Date(value);
          if (mode === 'date') {
            const [year, month, day] = e.target.value.split('-');
            newDate.setFullYear(Number(year));
            newDate.setMonth(Number(month) - 1);
            newDate.setDate(Number(day));
          } else {
            const [hours, minutes] = e.target.value.split(':');
            newDate.setHours(Number(hours));
            newDate.setMinutes(Number(minutes));
          }
          onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
        }}
        style={style}
        testID={testID}
        {...rest}
      />
    );
  }

  // Try to use the native DateTimePicker component
  if (DateTimePicker) {
    try {
      return (
        <DateTimePicker
          value={value}
          onChange={onChange}
          mode={mode}
          display={display || 'default'}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          style={style}
          testID={testID}
          {...rest}
        />
      );
    } catch (error) {
      console.warn('Error rendering DateTimePicker:', error);
      // If it fails, we'll use our enhanced fallback below
    }
  }

  // Enhanced fallback UI when the component fails to render
  // This provides actual date selection functionality
  return (
    <>
      <TouchableOpacity 
        style={[styles.fallbackContainer, style]} 
        onPress={() => setShowFallbackPicker(true)}
        testID={testID}
      >
        <View style={styles.fallbackContent}>
          <Ionicons name="calendar-outline" size={16} color="#0a7ea4" style={styles.fallbackIcon} />
          <Text style={styles.fallbackDate}>
            {value.toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.fallbackHint}>Tap to select date</Text>
      </TouchableOpacity>

      <Modal
        visible={showFallbackPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFallbackPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowFallbackPicker(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {mode === 'date' ? (
              <FallbackDatePicker 
                currentDate={value}
                onDateSelect={(newDate) => {
                  onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
                  setShowFallbackPicker(false);
                }}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            ) : (
              <FallbackTimePicker 
                currentTime={value}
                onTimeSelect={(newTime) => {
                  onChange({ type: 'set', nativeEvent: { timestamp: newTime.getTime() } }, newTime);
                  setShowFallbackPicker(false);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

// Custom date picker component for fallback
const FallbackDatePicker = ({ currentDate, onDateSelect, minimumDate, maximumDate }) => {
  // Create a new date object to avoid mutating the original
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
  
  // Get min and max years
  const minYear = minimumDate ? minimumDate.getFullYear() : selectedDate.getFullYear() - 5;
  const maxYear = maximumDate ? maximumDate.getFullYear() : selectedDate.getFullYear() + 5;
  
  // Create arrays for days, months, and years
  const months = ["January", "February", "March", "April", "May", "June", "July", 
                  "August", "September", "October", "November", "December"];
  
  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();
  
  const handleDaySelect = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };
  
  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthIndex);
    
    // Adjust the day if the new month doesn't have as many days
    const newDaysInMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth() + 1,
      0
    ).getDate();
    
    if (newDate.getDate() > newDaysInMonth) {
      newDate.setDate(newDaysInMonth);
    }
    
    setSelectedDate(newDate);
  };
  
  const handleYearSelect = (year) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
  };

  return (
    <View style={styles.fallbackPickerContainer}>
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Year</Text>
        <ScrollView style={styles.pickerScrollView}>
          {Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).map(year => (
            <TouchableOpacity
              key={year}
              style={[
                styles.pickerItem,
                selectedDate.getFullYear() === year && styles.selectedPickerItem
              ]}
              onPress={() => handleYearSelect(year)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedDate.getFullYear() === year && styles.selectedPickerItemText
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Month</Text>
        <ScrollView style={styles.pickerScrollView}>
          {months.map((month, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pickerItem,
                selectedDate.getMonth() === index && styles.selectedPickerItem
              ]}
              onPress={() => handleMonthSelect(index)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedDate.getMonth() === index && styles.selectedPickerItemText
              ]}>
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Day</Text>
        <ScrollView style={styles.pickerScrollView}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
            <TouchableOpacity
              key={day}
              style={[
                styles.pickerItem,
                selectedDate.getDate() === day && styles.selectedPickerItem
              ]}
              onPress={() => handleDaySelect(day)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedDate.getDate() === day && styles.selectedPickerItemText
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => onDateSelect(selectedDate)}
      >
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom time picker component for fallback
const FallbackTimePicker = ({ currentTime, onTimeSelect }) => {
  // Create a new date object to avoid mutating the original
  const [selectedTime, setSelectedTime] = useState(new Date(currentTime));
  
  const handleHourSelect = (hour) => {
    const newTime = new Date(selectedTime);
    newTime.setHours(hour);
    setSelectedTime(newTime);
  };
  
  const handleMinuteSelect = (minute) => {
    const newTime = new Date(selectedTime);
    newTime.setMinutes(minute);
    setSelectedTime(newTime);
  };

  return (
    <View style={styles.fallbackPickerContainer}>
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Hour</Text>
        <ScrollView style={styles.pickerScrollView}>
          {Array.from({ length: 24 }, (_, i) => i).map(hour => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.pickerItem,
                selectedTime.getHours() === hour && styles.selectedPickerItem
              ]}
              onPress={() => handleHourSelect(hour)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedTime.getHours() === hour && styles.selectedPickerItemText
              ]}>
                {hour.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Minute</Text>
        <ScrollView style={styles.pickerScrollView}>
          {Array.from({ length: 60 }, (_, i) => i).map(minute => (
            <TouchableOpacity
              key={minute}
              style={[
                styles.pickerItem,
                selectedTime.getMinutes() === minute && styles.selectedPickerItem
              ]}
              onPress={() => handleMinuteSelect(minute)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedTime.getMinutes() === minute && styles.selectedPickerItemText
              ]}>
                {minute.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => onTimeSelect(selectedTime)}
      >
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 50,
    justifyContent: 'center',
  },
  fallbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fallbackIcon: {
    marginRight: 8,
  },
  fallbackDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fallbackHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  closeButton: {
    padding: 5,
  },
  fallbackPickerContainer: {
    flexDirection: 'column',
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  pickerScrollView: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedPickerItem: {
    backgroundColor: '#0a7ea4',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPickerItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SafeDateTimePicker;