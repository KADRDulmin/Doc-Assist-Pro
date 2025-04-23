import React, { useState } from 'react';
import { View, Platform, TouchableOpacity, StyleSheet, Button, Alert, TextInput } from 'react-native';
import { ThemedText } from '../../components/ThemedText';

// For Android, we need to use a different approach since the DateTimePicker has issues
// directly importing the module - it may cause "RNCMaterialDatePicker" errors
let DateTimePicker: any = null;

// Only try to import on native platforms
if (Platform.OS !== 'web') {
  try {
    // Using require instead of import to handle conditional loading
    DateTimePicker = require('@react-native-community/datetimepicker').default;
    console.log('DateTimePicker module loaded successfully');
  } catch (e) {
    console.error('DateTimePicker module could not be loaded:', e);
  }
}

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
    
    if (!DateTimePicker) {
      console.warn('DateTimePicker is not available on this platform');
      
      // Fallback for when DateTimePicker is not available
      if (Platform.OS === 'android') {
        try {
          // Try the alternative approach for Android
          const { startActivityAsync, DatePickerAndroid } = require('expo-intent-launcher');
          startActivityAsync('android.intent.action.VIEW', {
            type: DatePickerAndroid,
            extra: {
              mode: 'spinner',
              minDate: new Date(1920, 0, 1).getTime(),
              maxDate: maximumDate?.getTime() || new Date().getTime()
            }
          }).then((result: any) => {
            if (result && result.year && result.month && result.day) {
              const selected = new Date(result.year, result.month, result.day);
              onChange(selected);
            }
          }).catch((err: any) => {
            console.error('Failed to show Android date picker:', err);
            // Show manual input dialog instead
            promptForManualDate();
          });
        } catch (e) {
          console.error('Failed to use expo-intent-launcher for date picking:', e);
          // Show manual input dialog instead
          promptForManualDate();
        }
      } else {
        // Simple alert for other platforms
        promptForManualDate();
      }
      return;
    }
    
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

      {/* Only render DateTimePicker when show is true AND the component is available */}
      {show && DateTimePicker ? (
        <DateTimePicker
          testID="dateTimePicker"
          value={value}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={maximumDate}
        />
      ) : null}

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
