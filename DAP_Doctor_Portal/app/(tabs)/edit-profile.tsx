import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { TextInput as RNTextInputPaper } from 'react-native-paper';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useAuth } from '../../contexts/AuthContext';
import doctorService from '../../services/doctorService';
import ModernHeader from '../../components/ui/ModernHeader';
import { DoctorProfile } from '../../services/authService';

// Supported specializations from backend
const specializations = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 'Radiology',
  'Surgery', 'Urology', 'General Medicine', 'Orthopedics', 'Gynecology', 
  'Ophthalmology', 'ENT', 'Dental'
];

interface FormData {
  first_name: string;
  last_name: string;
  phone: string;
  specialization: string;
  years_of_experience: string;
  education: string;
  bio: string;
  consultation_fee: string;
  address: string;
}

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      specialization: '',
      years_of_experience: '',
      education: '',
      bio: '',
      consultation_fee: '',
      address: ''
    }
  });

  useEffect(() => {
    // Fetch current profile data
    const fetchProfile = async () => {
      try {
        if (!token) return;
        const response = await doctorService.getDashboard(token);
        if (response.success && response.data?.profile) {
          const profile = response.data.profile;
          setValue('specialization', profile.specialization);
          setValue('years_of_experience', profile.years_of_experience.toString());
          setValue('education', profile.education);
          setValue('bio', profile.bio);
          setValue('consultation_fee', profile.consultation_fee.toString());
          setValue('address', profile.address || '');
          if (profile.user) {
            setValue('first_name', profile.user.first_name);
            setValue('last_name', profile.user.last_name);
            setValue('phone', profile.user.phone || '');
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      }
    };

    fetchProfile();
  }, [token, setValue]);
  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Update profile using doctorService
      const updateData = {
        specialization: data.specialization,
        years_of_experience: parseInt(data.years_of_experience, 10),
        education: data.education,
        bio: data.bio,
        consultation_fee: parseFloat(data.consultation_fee),
        address: data.address
      };

      const response = await doctorService.updateProfile(token, updateData);
      
      if (response.success) {
        // Update local user data
        if (user) {
          const updatedUser = { 
            ...user,
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone
          };
          updateUser(updatedUser);
        }

        Alert.alert(
          'Success',
          'Profile updated successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView variant="secondary" style={styles.container}>
      <ModernHeader 
        title="Edit Profile"
        leftIconName="chevron-left"
        onLeftPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Personal Information */}
          <ThemedView variant="card" useShadow style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="user" size={16} color={Colors[theme].primary} />
              <ThemedText type="subheading" style={styles.sectionTitle}>
                Personal Information
              </ThemedText>
            </View>

            <Controller
              control={control}
              name="first_name"
              rules={{ required: 'First name is required' }}              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="First Name"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.first_name}
                  style={styles.input}
                  mode="outlined"
                />
              )}
            />

            <Controller
              control={control}
              name="last_name"
              rules={{ required: 'Last name is required' }}              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="Last Name"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.last_name}
                  style={styles.input}
                  mode="outlined"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              rules={{ required: 'Phone number is required' }}              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="Phone Number"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.phone}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
              )}
            />
          </ThemedView>

          {/* Professional Information */}
          <ThemedView variant="card" useShadow style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="user-md" size={16} color={Colors[theme].primary} />
              <ThemedText type="subheading" style={styles.sectionTitle}>
                Professional Information
              </ThemedText>
            </View>

            <Controller
              control={control}
              name="specialization"
              rules={{ required: 'Specialization is required' }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <ThemedText variant="secondary" style={styles.label}>
                    Specialization
                  </ThemedText>
                  <View style={[
                    styles.picker,
                    { backgroundColor: Colors[theme].inputBackground }
                  ]}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={{ color: Colors[theme].text }}
                      dropdownIconColor={Colors[theme].text}
                    >
                      <Picker.Item label="Select Specialization" value="" />
                      {specializations.map((item) => (
                        <Picker.Item key={item} label={item} value={item} />
                      ))}
                    </Picker>
                  </View>
                  {errors.specialization && (
                    <ThemedText style={styles.errorText}>
                      {errors.specialization.message}
                    </ThemedText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="years_of_experience"
              rules={{
                required: 'Years of experience is required',
                min: { value: 0, message: 'Experience cannot be negative' }
              }}              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="Years of Experience"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.years_of_experience}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />
              )}
            />

            <Controller
              control={control}
              name="education"
              rules={{ required: 'Education is required' }}              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="Education"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.education}
                  style={styles.input}
                  mode="outlined"
                  multiline
                />
              )}
            />

            <Controller
              control={control}
              name="bio"              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="Professional Bio"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.bio}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                />
              )}
            />

            <Controller
              control={control}
              name="consultation_fee"
              rules={{
                required: 'Consultation fee is required',
                min: { value: 0, message: 'Fee cannot be negative' }
              }}              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="Consultation Fee (USD)"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.consultation_fee}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />
              )}
            />
          </ThemedView>

          {/* Location Information */}
          <ThemedView variant="card" useShadow style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="map-marker-alt" size={16} color={Colors[theme].primary} />
              <ThemedText type="subheading" style={styles.sectionTitle}>
                Location Information
              </ThemedText>
            </View>

            <Controller
              control={control}
              name="address"
              rules={{ required: 'Address is required' }}              render={({ field: { onChange, value } }) => (
                <RNTextInputPaper
                  label="Office Address"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.address}
                  style={styles.input}
                  mode="outlined"
                  multiline
                />
              )}
            />
          </ThemedView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: Colors[theme].primary },
              isLoading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <ThemedText style={styles.submitButtonText}>
              {isLoading ? 'Updating...' : 'Save Changes'}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 18,
  },
  input: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  picker: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
