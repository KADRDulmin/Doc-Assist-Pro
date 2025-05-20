import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  View,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  useColorScheme
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { DatePicker } from '../../src/components/DatePicker';
import { LocationSelector } from '../../components/maps';
import type { LocationData } from '../../components/maps/types';
import { API_URL } from '../../src/services/api/base-api.service';
import { useAuth } from '../../src/hooks/useAuth';

// Blood group options
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get('window');

export default function PatientRegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiUrl, setApiUrl] = useState('');
  const [currentSection, setCurrentSection] = useState<'basic' | 'medical'>('basic');  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    location: ''
  });
  
  const { isLoading, registerPatient } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define theme specific colors
  const backgroundColor = isDarkMode ? '#151718' : '#f8f8f8';
  const cardBackground = isDarkMode ? '#1e2022' : '#fff';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const inputBackground = isDarkMode ? '#2c3e50' : '#f9f9f9';
  const inputBorderColor = isDarkMode ? '#34495e' : '#ddd';
  const textColor = isDarkMode ? '#f5f5f5' : '#333';
  const placeholderColor = isDarkMode ? '#78909c' : '#999';
  const primaryColor = isDarkMode ? '#A1CEDC' : '#0a7ea4';
  const errorColor = '#ff3b30';
  
  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  useEffect(() => {
    setApiUrl(API_URL);
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        setServerStatus(response.ok ? 'online' : 'offline');
      } catch (error) {
        console.error('Server health check failed:', error);
        setServerStatus('offline');
      }
    };
    checkServerStatus();
  }, []);

  const validateBasicInfo = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    } else {
      newErrors.email = '';
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    } else {
      newErrors.password = '';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    } else {
      newErrors.firstName = '';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    } else {
      newErrors.lastName = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateMedicalInfo = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!gender) {
      newErrors.gender = 'Please select your gender';
      isValid = false;
    } else {
      newErrors.gender = '';
    }

    if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
      newErrors.bloodGroup = 'Please select a valid blood group';
      isValid = false;
    } else {
      newErrors.bloodGroup = '';
    }    if (!location) {
      newErrors.location = 'Please select your location';
      isValid = false;
    } else {
      newErrors.location = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = () => {
    if (validateBasicInfo()) {
      setCurrentSection('medical');
    }
  };

  const handleBack = () => {
    setCurrentSection('basic');
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleRegister = async () => {
    const basicValid = validateBasicInfo();
    const medicalValid = validateMedicalInfo();
    
    if (!basicValid) {
      setCurrentSection('basic');
      return;
    }
    
    if (!medicalValid) {
      return;
    }

    if (serverStatus !== 'online') {
      Alert.alert(
        'Server Unavailable',
        `Cannot connect to the server at ${apiUrl}. Please check your connection and try again.`
      );
      return;
    }

    try {
      console.log('Attempting patient registration...');
        if (!location) {
        Alert.alert('Error', 'Please select your location');
        return;
      }

      const patientData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: formatDate(dateOfBirth),
        gender,
        blood_group: bloodGroup,
        allergies,
        medical_history: medicalHistory,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      };
      
      await registerPatient(patientData);
      
      Alert.alert(
        'Registration Successful',
        'Your patient account has been created successfully. Please login.',
        [{ text: 'Login', onPress: () => router.push('/(auth)/login') }]
      );
    } catch (error) {
      console.error('Registration failed:', error);
      let errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      if (errorMessage.includes('already exists')) {
        errorMessage = 'This email is already registered. Please try logging in instead.';
      } else if (errorMessage.includes('Network error')) {
        errorMessage += '\n\nTips:\n1. Check if your backend server is running\n' + 
                       `2. Make sure ${apiUrl} is accessible from your device`;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    }
  };
  const [location, setLocation] = useState<LocationData | null>(null);

  const handleLocationChange = (newLocation: LocationData) => {
    setLocation(newLocation);
  };

  const renderBasicInfoSection = () => (
    <View style={styles.formContainer}>
      <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Your Location</ThemedText>        <LocationSelector
          onLocationChange={handleLocationChange}
          title=""
          height={200}
        />
        {errors.location ? <ThemedText style={styles.errorText}>{errors.location}</ThemedText> : null}
      </View>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Email Address</ThemedText>
        <TextInput
          style={[
            styles.input, 
            {backgroundColor: inputBackground, borderColor: errors.email ? errorColor : inputBorderColor, color: textColor},
          ]}
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors({...errors, email: ''});
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={placeholderColor}
        />
        {errors.email ? <ThemedText style={styles.errorText}>{errors.email}</ThemedText> : null}
      </View>

      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <ThemedText style={[styles.label, {color: textColor}]}>First Name</ThemedText>
          <TextInput
            style={[
              styles.input, 
              {backgroundColor: inputBackground, borderColor: errors.firstName ? errorColor : inputBorderColor, color: textColor},
            ]}
            placeholder="First name"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (errors.firstName) setErrors({...errors, firstName: ''});
            }}
            placeholderTextColor={placeholderColor}
          />
          {errors.firstName ? <ThemedText style={styles.errorText}>{errors.firstName}</ThemedText> : null}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <ThemedText style={[styles.label, {color: textColor}]}>Last Name</ThemedText>
          <TextInput
            style={[
              styles.input, 
              {backgroundColor: inputBackground, borderColor: errors.lastName ? errorColor : inputBorderColor, color: textColor},
            ]}
            placeholder="Last name"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (errors.lastName) setErrors({...errors, lastName: ''});
            }}
            placeholderTextColor={placeholderColor}
          />
          {errors.lastName ? <ThemedText style={styles.errorText}>{errors.lastName}</ThemedText> : null}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Phone Number (optional)</ThemedText>
        <TextInput
          style={[
            styles.input, 
            {backgroundColor: inputBackground, borderColor: inputBorderColor, color: textColor},
          ]}
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={placeholderColor}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Password</ThemedText>
        <TextInput
          style={[
            styles.input, 
            {backgroundColor: inputBackground, borderColor: errors.password ? errorColor : inputBorderColor, color: textColor},
          ]}
          placeholder="Create a password (minimum 6 characters)"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors({...errors, password: ''});
          }}
          secureTextEntry
          placeholderTextColor={placeholderColor}
        />
        {errors.password ? <ThemedText style={styles.errorText}>{errors.password}</ThemedText> : null}
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Confirm Password</ThemedText>
        <TextInput
          style={[
            styles.input, 
            {backgroundColor: inputBackground, borderColor: errors.confirmPassword ? errorColor : inputBorderColor, color: textColor},
          ]}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
          }}
          secureTextEntry
          placeholderTextColor={placeholderColor}
        />
        {errors.confirmPassword ? <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText> : null}
      </View>

      <TouchableOpacity
        style={[styles.buttonPrimary, {backgroundColor: primaryColor}]}
        onPress={handleContinue}
      >
        <ThemedText style={styles.buttonText}>Continue</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderMedicalInfoSection = () => (
    <View style={styles.formContainer}>
      <ThemedText style={styles.sectionTitle}>Medical Information</ThemedText>
      
      <View style={styles.inputGroup}>
        <DatePicker
          label="Date of Birth (Tap to select)"
          value={dateOfBirth}
          onChange={(date) => {
            console.log('Date selected:', date);
            setDateOfBirth(date);
          }}
          maximumDate={new Date()}
          hasError={!!errors.dateOfBirth}
          isDarkMode={isDarkMode}
        />
        {errors.dateOfBirth ? <ThemedText style={styles.errorText}>{errors.dateOfBirth}</ThemedText> : null}
      </View>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Gender</ThemedText>
        <View style={[
          styles.pickerContainer, 
          {
            borderColor: errors.gender ? errorColor : inputBorderColor,
            backgroundColor: inputBackground
          }
        ]}>
          <Picker
            selectedValue={gender}
            onValueChange={(value) => setGender(value)}
            style={styles.picker}
            dropdownIconColor={isDarkMode ? primaryColor : undefined}
          >
            <Picker.Item label="Select Gender" value="" color={placeholderColor} />
            {GENDERS.map((item) => (
              <Picker.Item key={item} label={item} value={item} color={textColor} />
            ))}
          </Picker>
        </View>
        {errors.gender ? <ThemedText style={styles.errorText}>{errors.gender}</ThemedText> : null}
      </View>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Blood Group (optional)</ThemedText>
        <View style={[
          styles.pickerContainer, 
          {
            borderColor: errors.bloodGroup ? errorColor : inputBorderColor,
            backgroundColor: inputBackground
          }
        ]}>
          <Picker
            selectedValue={bloodGroup}
            onValueChange={(value) => setBloodGroup(value)}
            style={styles.picker}
            dropdownIconColor={isDarkMode ? primaryColor : undefined}
          >
            <Picker.Item label="Select Blood Group" value="" color={placeholderColor} />
            {BLOOD_GROUPS.map((item) => (
              <Picker.Item key={item} label={item} value={item} color={textColor} />
            ))}
          </Picker>
        </View>
        {errors.bloodGroup ? <ThemedText style={styles.errorText}>{errors.bloodGroup}</ThemedText> : null}
      </View>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Allergies (optional)</ThemedText>
        <TextInput
          style={[
            styles.input, 
            styles.textArea,
            {backgroundColor: inputBackground, borderColor: inputBorderColor, color: textColor},
          ]}
          placeholder="Enter any allergies you may have"
          value={allergies}
          onChangeText={setAllergies}
          multiline
          placeholderTextColor={placeholderColor}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Medical History (optional)</ThemedText>
        <TextInput
          style={[
            styles.input, 
            styles.textArea,
            {backgroundColor: inputBackground, borderColor: inputBorderColor, color: textColor},
          ]}
          placeholder="Enter relevant medical history"
          value={medicalHistory}
          onChangeText={setMedicalHistory}
          multiline
          placeholderTextColor={placeholderColor}
        />
      </View>
      
      <View style={[styles.divider, {borderTopColor: borderColor}]}>
        <ThemedText style={[styles.dividerText, {color: textColor}]}>Emergency Contact</ThemedText>
      </View>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Emergency Contact Name (optional)</ThemedText>
        <TextInput
          style={[
            styles.input, 
            {backgroundColor: inputBackground, borderColor: inputBorderColor, color: textColor},
          ]}
          placeholder="Name of emergency contact"
          value={emergencyContactName}
          onChangeText={setEmergencyContactName}
          placeholderTextColor={placeholderColor}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, {color: textColor}]}>Emergency Contact Phone (optional)</ThemedText>
        <TextInput
          style={[
            styles.input, 
            {backgroundColor: inputBackground, borderColor: inputBorderColor, color: textColor},
          ]}
          placeholder="Phone number of emergency contact"
          value={emergencyContactPhone}
          onChangeText={setEmergencyContactPhone}
          keyboardType="phone-pad"
          placeholderTextColor={placeholderColor}
        />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={[styles.backButton, {borderColor: primaryColor}]} 
          onPress={handleBack}
        >
          <ThemedText style={[styles.backButtonText, {color: primaryColor}]}>Back</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buttonPrimary, 
            styles.registerButton, 
            {backgroundColor: serverStatus === 'offline' ? '#cccccc' : primaryColor}
          ]}
          onPress={handleRegister}
          disabled={isLoading || serverStatus === 'offline'}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Register</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ThemedView style={[styles.container, {backgroundColor}]}>
        {serverStatus === 'offline' && (
          <ThemedView style={styles.offlineBar}>
            <ThemedText style={styles.offlineText}>
              Server is offline. Please check your connection.
            </ThemedText>
          </ThemedView>
        )}

        <LinearGradient
          colors={isDarkMode ? headerGradientDark : headerGradientLight}
          style={styles.headerContainer}
        >
          <ThemedText type="title" style={[styles.title, {color: '#fff'}]}>Doc-Assist-Pro</ThemedText>
          <ThemedText style={[styles.subtitle, {color: isDarkMode ? '#e0e0e0' : '#fff'}]}>Patient Registration</ThemedText>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={[styles.card, {backgroundColor: cardBackground, borderColor: borderColor}]}>
            {currentSection === 'basic' ? renderBasicInfoSection() : renderMedicalInfoSection()}
          </ThemedView>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.linkContainer}
          >
            <ThemedText style={[styles.link, {color: primaryColor}]}>Already have an account? Login</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 5,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  formContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 15,
    marginBottom: 5,
    marginLeft: 2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonPrimary: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButton: {
    flex: 1,
    marginLeft: 10,
  },
  backButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    marginTop: 5,
    alignItems: 'center',
    paddingVertical: 10,
  },
  link: {
    fontSize: 15,
  },
  offlineBar: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 0,
    marginBottom: 5,
  },
  offlineText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: 14,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    borderTopWidth: 1,
  },
  dividerText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    marginRight: 10,
  },
});