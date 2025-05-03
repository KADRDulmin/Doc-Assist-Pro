import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Safely import DateTimePicker with error handling
let DateTimePicker;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker could not be imported:', error);
  // Create a mock component if import fails
  DateTimePicker = ({ value, onChange, mode }) => {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          {mode === 'date' 
            ? `Date: ${value.toLocaleDateString()}` 
            : `Time: ${value.toLocaleTimeString()}`}
        </Text>
      </View>
    );
  };
}

/**
 * A safe wrapper around DateTimePicker that handles native module errors
 */
const SafeDateTimePicker = ({
  value = new Date(),
  onChange,
  mode = 'date',
  display,
  minimumDate,
  maximumDate,
  textColor,
  style,
  ...props
}) => {
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  
  // Format the date/time for display
  const formattedValue = mode === 'date'
    ? value.toLocaleDateString()
    : value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Handle the date/time change
  const handleChange = (event, selectedValue) => {
    // Hide the picker for Android
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    // Only call onChange if a date was selected
    if (event.type !== 'dismissed' && selectedValue) {
      onChange(event, selectedValue);
    }
  };
  
  // Show the picker (for Android)
  const showDatePicker = () => {
    setShowPicker(true);
  };
  
  // Return iOS style (always visible) or Android style (button to show picker)
  if (Platform.OS === 'ios') {
    // Try to render the DateTimePicker, fallback to our mock version if it fails
    try {
      return (
        <View style={[styles.container, style]}>
          <DateTimePicker
            value={value}
            mode={mode}
            display={display || 'spinner'}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            textColor={textColor}
            {...props}
          />
        </View>
      );
    } catch (error) {
      console.warn('Error rendering DateTimePicker:', error);
      return (
        <View style={[styles.fallbackContainer, style]}>
          <Text style={styles.fallbackText}>{formattedValue}</Text>
        </View>
      );
    }
  }
  
  // Android
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={showDatePicker}
      >
        <Ionicons 
          name={mode === 'date' ? 'calendar' : 'time'} 
          size={20} 
          color="#0a7ea4" 
        />
        <Text style={styles.buttonText}>
          {formattedValue}
        </Text>
      </TouchableOpacity>
      
      {showPicker && (
        // Try to render the DateTimePicker, catch any errors
        (() => {
          try {
            return (
              <DateTimePicker
                value={value}
                mode={mode}
                display={display || 'default'}
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                {...props}
              />
            );
          } catch (error) {
            console.warn('Error rendering DateTimePicker:', error);
            return (
              <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackText}>{formattedValue}</Text>
              </View>
            );
          }
        })()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  fallbackContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fallbackText: {
    fontSize: 16,
    color: '#555',
  },
});

export default SafeDateTimePicker;