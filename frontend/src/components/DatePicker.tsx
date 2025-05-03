import React, { useState } from 'react';
import { View, Platform, TouchableOpacity, StyleSheet, Button, Alert, TextInput } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { SafeDateTimePicker } from '@/components/common';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  label?: string;
  placeholder?: string;
  hasError?: boolean;
}

export const DatePicker = ({
  value,
  onChange,
  maximumDate,
  label,
  placeholder = 'Select Date',
  hasError = false
}: DatePickerProps) => {
  const [show, setShow] = useState(false);
  const [manualDateInput, setManualDateInput] = useState('');

  // Format date for display
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (_: any, selectedDate?: Date) => {
    console.log('DatePicker onChange called, new date:', selectedDate);
    setShow(false); // Always hide the picker after selection on Android
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  // Handle manual date input
  const promptForManualDate = () => {
    // Create a temporary state for the date
    setManualDateInput(formatDate(value));
    
    Alert.alert(
      "Select Date",
      "Enter date (YYYY-MM-DD):",
      [
        { text: "Cancel" },
        { 
          text: "OK", 
          onPress: () => {
            if (manualDateInput) {
              try {
                const [year, month, day] = manualDateInput.split('-').map(Number);
                if (year && month && day && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
                  const newDate = new Date(year, month-1, day);
                  onChange(newDate);
                } else {
                  Alert.alert("Invalid Date", "Please use YYYY-MM-DD format");
                }
              } catch (error) {
                console.error("Date parsing error:", error);
                Alert.alert("Invalid Date", "Please use YYYY-MM-DD format");
              }
            }
          }
        }
      ]
    );
  };

  const showDatepicker = () => {
    console.log('Attempting to show date picker');
    
    if (Platform.OS === 'web') {
      // For web, just show the manual input
      promptForManualDate();
      return;
    }
    
    // For mobile platforms, show the picker
    setShow(true);
  };

  // Android-safe implementation
  return (
    <View>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      
      <TouchableOpacity
        style={[styles.dateSelector, hasError && styles.errorBorder]}
        onPress={showDatepicker}
        activeOpacity={0.7} // Add visual feedback on press
      >
        <ThemedText>{formatDate(value)}</ThemedText>
      </TouchableOpacity>

      {/* Use our SafeDateTimePicker instead of direct DateTimePicker */}
      {show && (
        <SafeDateTimePicker
          testID="dateTimePicker"
          value={value}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={maximumDate}
        />
      )}

      {/* This input is just for state storage, not visible */}
      <TextInput
        value={manualDateInput}
        onChangeText={setManualDateInput}
        style={{ display: 'none' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
  },
  dateSelector: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorBorder: {
    borderColor: '#ff3b30',
    borderWidth: 1,
  }
});
