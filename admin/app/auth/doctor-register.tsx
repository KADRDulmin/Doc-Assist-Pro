import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Colors } from '@/constants/Colors';

export default function DoctorRegisterScreen() {
  // Personal information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Professional information
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [education, setEducation] = useState('');
  const [bio, setBio] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  const { registerDoctor } = useContext(AuthContext);
  
  const specializations = [
    'Select Specialization',
    'Cardiology', 
    'Dermatology', 
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'Urology',
    'General Medicine',
    'Orthopedics',
    'Gynecology',
    'Ophthalmology',
    'ENT',
    'Dental'
  ];
  
  const validateStep1 = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Password is required');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = () => {
    if (!specialization || specialization === 'Select Specialization') {
      Alert.alert('Error', 'Specialization is required');
      return false;
    }
    if (!licenseNumber.trim()) {
      Alert.alert('Error', 'License number is required');
      return false;
    }
    
    return true;
  };
  
  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };
  
  const handlePrevStep = () => {
    setCurrentStep(1);
  };
  
  const handleRegister = async () => {
    if (!validateStep2()) return;
    
    setIsLoading(true);
    try {
      await registerDoctor({
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        phone,
        specialization,
        licenseNumber,
        yearsOfExperience,
        education,
        bio,
        consultationFee
      });
      
      Alert.alert(
        'Registration Successful',
        'Your doctor account has been created. You can now login.',
        [
          { text: 'OK', onPress: () => router.push('/auth/doctor-login') }
        ]
      );
    } catch (error) {
      // More detailed error handling
      let errorMessage = 'Failed to register. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific errors
        if (error.message.includes('Network request failed')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection or contact support.';
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Doctor Registration</Text>
          <Text style={styles.subtitle}>
            {currentStep === 1 ? 'Personal Information' : 'Professional Information'}
          </Text>
        </View>
        
        <View style={styles.stepIndicator}>
          <View style={[styles.step, currentStep === 1 ? styles.activeStep : null]}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.step, currentStep === 2 ? styles.activeStep : null]}>
            <Text style={styles.stepText}>2</Text>
          </View>
        </View>
        
        {currentStep === 1 ? (
          <View style={styles.formContainer}>
            {/* Step 1: Personal Information */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility-off" : "visibility"} 
                  size={22} 
                  color={Colors.grey} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextStep}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Step 2: Professional Information */}
            <View style={styles.pickerContainer}>
              <MaterialIcons name="local-hospital" size={22} color={Colors.primary} style={styles.inputIcon} />
              <View style={styles.picker}>
                <Picker
                  selectedValue={specialization}
                  onValueChange={(value) => setSpecialization(value)}
                  style={styles.pickerInput}
                >
                  {specializations.map((spec, index) => (
                    <Picker.Item key={index} label={spec} value={spec === 'Select Specialization' ? '' : spec} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="badge" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="License Number"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="work" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Years of Experience"
                keyboardType="numeric"
                value={yearsOfExperience}
                onChangeText={setYearsOfExperience}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="school" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Education (e.g., MBBS, MD)"
                value={education}
                onChangeText={setEducation}
              />
            </View>
            
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <MaterialIcons name="description" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Short Bio (optional)"
                multiline={true}
                numberOfLines={4}
                value={bio}
                onChangeText={setBio}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="attach-money" size={22} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Consultation Fee (optional)"
                keyboardType="numeric"
                value={consultationFee}
                onChangeText={setConsultationFee}
              />
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={handlePrevStep}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.registerButton]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/doctor-login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.backToWelcomeButton}
          onPress={() => router.push('/auth/welcome')}
        >
          <Text style={styles.backToWelcomeText}>Back to Welcome Screen</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary || '#0066cc',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey || '#888888',
    marginTop: 5,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lightGrey || '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: Colors.primary || '#0066cc',
  },
  stepText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.lightGrey || '#e0e0e0',
    maxWidth: 60,
    marginHorizontal: 10,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border || '#ddd',
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: 50,
  },
  textAreaContainer: {
    height: 100,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  textArea: {
    height: 90,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  eyeIcon: {
    padding: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border || '#ddd',
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: 50,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  pickerInput: {
    width: '100%',
  },
  nextButton: {
    backgroundColor: Colors.primary || '#0066cc',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary || '#0066cc',
    marginRight: 10,
  },
  registerButton: {
    backgroundColor: Colors.primary || '#0066cc',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: Colors.primary || '#0066cc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    fontSize: 14,
    color: Colors.text || '#333333',
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary || '#0066cc',
    fontWeight: 'bold',
  },
  backToWelcomeButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backToWelcomeText: {
    color: Colors.grey || '#888888',
    fontSize: 14,
  },
});
