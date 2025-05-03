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
// Replace DateTimePicker import with our safe version
import { SafeDateTimePicker } from '@/components/common';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LocationSelector, LocationData } from '@/components/maps';
import { useColorScheme } from '@/hooks/useColorScheme';
import patientService, { PatientProfileData, PatientProfileUpdateData } from '@/src/services/patient.service';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  
  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Blood group options
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await patientService.getMyProfile();
      
      if (response.success && response.data) {
        const profile = response.data;
        
        // Parse the date string into a Date object if it exists
        setDateOfBirth(profile.date_of_birth ? new Date(profile.date_of_birth) : null);
        setGender(profile.gender || '');
        setBloodGroup(profile.blood_group || '');
        setAllergies(profile.allergies || '');
        setMedicalHistory(profile.medical_history || '');
        setEmergencyContactName(profile.emergency_contact_name || '');
        setEmergencyContactPhone(profile.emergency_contact_phone || '');
        
        // Set location data if available
        if (profile.latitude && profile.longitude) {
          setLocation({
            latitude: profile.latitude,
            longitude: profile.longitude,
            address: profile.address || ''
          });
        }
      } else {
        setError('Failed to load profile data');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err?.message || 'An error occurred while fetching your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (newLocation: LocationData) => {
    setLocation(newLocation);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Prepare data for update
      const updateData: PatientProfileUpdateData = {
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
        gender: gender || undefined,
        blood_group: bloodGroup || undefined,
        allergies: allergies || undefined,
        medical_history: medicalHistory || undefined,
        emergency_contact_name: emergencyContactName || undefined,
        emergency_contact_phone: emergencyContactPhone || undefined,
      };

      // Add location data if available
      if (location) {
        updateData.latitude = location.latitude;
        updateData.longitude = location.longitude;
        updateData.address = location.address;
      }

      // Send update request
      const response = await patientService.updateProfile(updateData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your profile has been updated successfully.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || 'An error occurred while updating your profile');
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const toggleSelect = (option: string, currentValue: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(currentValue === option ? '' : option);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading profile data...</ThemedText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerBackTitle: '',
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#e53935" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          {/* Basic Information Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Date of Birth</ThemedText>
              
              {Platform.OS === 'ios' ? (
                <SafeDateTimePicker
                  value={dateOfBirth || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.datePickerIOS}
                />
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.datePickerButton} 
                    onPress={() => setShowDatePicker(true)}
                  >
                    <ThemedText>
                      {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select Date of Birth'}
                    </ThemedText>
                    <Ionicons name="calendar" size={20} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <SafeDateTimePicker
                      value={dateOfBirth || new Date()}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>

            {/* Gender Selection */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Gender</ThemedText>
              <View style={styles.optionsContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      gender === option && styles.selectedOption
                    ]}
                    onPress={() => toggleSelect(option, gender, setGender)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        gender === option && styles.selectedOptionText
                      ]}
                    >
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Blood Group Selection */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Blood Group</ThemedText>
              <View style={styles.optionsContainer}>
                {bloodGroupOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      styles.bloodGroupButton,
                      bloodGroup === option && styles.selectedOption
                    ]}
                    onPress={() => toggleSelect(option, bloodGroup, setBloodGroup)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        bloodGroup === option && styles.selectedOptionText
                      ]}
                    >
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ThemedView>

          {/* Location Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Your Location</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              This helps us find doctors near you
            </ThemedText>
            
            <LocationSelector
              initialLocation={location || undefined}
              onLocationChange={handleLocationChange}
              title=""
              height={300}
            />
          </ThemedView>

          {/* Medical Information */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Medical Information</ThemedText>

            {/* Allergies */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Allergies (Comma separated)</ThemedText>
              <TextInput
                style={styles.textInput}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="E.g. Peanuts, Penicillin, Latex"
                placeholderTextColor="#888"
                multiline
              />
            </View>

            {/* Medical History */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Medical History</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={medicalHistory}
                onChangeText={setMedicalHistory}
                placeholder="Any previous or ongoing medical conditions"
                placeholderTextColor="#888"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ThemedView>

          {/* Emergency Contact */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Emergency Contact</ThemedText>

            {/* Contact Name */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Contact Name</ThemedText>
              <TextInput
                style={styles.textInput}
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Full Name"
                placeholderTextColor="#888"
              />
            </View>

            {/* Contact Phone */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Contact Phone</ThemedText>
              <TextInput
                style={styles.textInput}
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                placeholder="Phone Number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            </View>
          </ThemedView>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save Profile</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
  },
  errorText: {
    marginLeft: 10,
    color: '#e53935',
    flex: 1,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.7,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
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
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  datePickerIOS: {
    width: '100%',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 5,
  },
  bloodGroupButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  optionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});