import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, HelperText, Chip, ProgressBar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import authService, { DoctorSignupData } from '../../services/authService';
import Colors from '../../constants/Colors';

// Step 1 validation schema (user account information)
const AccountInfoSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirm_password: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

// Step 2 validation schema (personal information)
const PersonalInfoSchema = Yup.object().shape({
  first_name: Yup.string()
    .required('First name is required')
    .min(2, 'First name is too short'),
  last_name: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name is too short'),
  phone: Yup.string()
    .required('Phone number is required')
    .min(10, 'Phone number is too short'),
});

// Step 3 validation schema (doctor-specific information)
const DoctorInfoSchema = Yup.object().shape({
  specialization: Yup.string()
    .required('Specialization is required'),
  license_number: Yup.string()
    .required('License number is required')
    .min(5, 'License number is too short'),
  years_of_experience: Yup.number()
    .min(0, 'Experience cannot be negative')
    .required('Years of experience is required'),
  education: Yup.string(),
  bio: Yup.string(),
  consultation_fee: Yup.number()
    .min(0, 'Fee cannot be negative'),
});

// Combined schema
const SignupSchema = AccountInfoSchema.concat(PersonalInfoSchema).concat(DoctorInfoSchema);

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');

  // Fetch available specializations from API
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const fetchedSpecializations = await authService.getDoctorSpecializations();
        if (fetchedSpecializations && fetchedSpecializations.length > 0) {
          setSpecializations(fetchedSpecializations);
        } else {
          // Fallback specializations if API call fails
          setSpecializations([
            'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 
            'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 'Radiology', 
            'Surgery', 'Urology', 'General Medicine', 'Orthopedics', 'Gynecology',
            'Ophthalmology', 'ENT', 'Dental'
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch specializations:', error);
        // Use fallback specializations
        setSpecializations([
          'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 
          'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 'Radiology', 
          'Surgery', 'Urology', 'General Medicine', 'Orthopedics', 'Gynecology',
          'Ophthalmology', 'ENT', 'Dental'
        ]);
      }
    };

    fetchSpecializations();
  }, []);

  const handleSignup = async (values: DoctorSignupData & { confirm_password: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove confirm_password before sending to API
      const { confirm_password, ...doctorData } = values;
      
      const response = await authService.signup(doctorData);
      
      if (response.success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been registered. Please log in to continue.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/auth/login'),
            },
          ],
          { cancelable: false }
        );
      } else {
        setError(response.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (validateForm: () => Promise<any>, values: any) => {
    // For step 1, we only validate email, password, and confirm_password
    if (step === 1) {
      // Validate only the account info fields
      const accountErrors: Record<string, string> = {};
      
      if (!values.email) {
        accountErrors['email'] = 'Email is required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        accountErrors['email'] = 'Invalid email address';
      }
      
      if (!values.password) {
        accountErrors['password'] = 'Password is required';
      } else if (values.password.length < 6) {
        accountErrors['password'] = 'Password must be at least 6 characters';
      }
      
      if (!values.confirm_password) {
        accountErrors['confirm_password'] = 'Please confirm your password';
      } else if (values.password !== values.confirm_password) {
        accountErrors['confirm_password'] = 'Passwords must match';
      }
      
      if (Object.keys(accountErrors).length === 0) {
        setStep(step + 1);
        setError(null);
      } else {
        // Display the first error
        const firstError = Object.values(accountErrors)[0];
        setError(firstError);
      }
    } 
    // For step 2, we validate personal info
    else if (step === 2) {
      validateForm().then((errors: any) => {
        const relevantErrors: Record<string, string> = {};
        
        // Only check errors for fields in step 2
        if (errors.first_name) relevantErrors['first_name'] = errors.first_name;
        if (errors.last_name) relevantErrors['last_name'] = errors.last_name;
        if (errors.phone) relevantErrors['phone'] = errors.phone;
        
        if (Object.keys(relevantErrors).length === 0) {
          setStep(step + 1);
          setError(null);
        } else {
          // Display the first error
          const firstError = Object.values(relevantErrors)[0];
          setError(firstError);
        }
      });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  // Calculate progress based on current step
  const progress = step / 3;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Doctor Registration</Text>
        <Text style={styles.headerSubtitle}>
          {step === 1 && 'Step 1: Account Information'}
          {step === 2 && 'Step 2: Personal Information'}
          {step === 3 && 'Step 3: Professional Information'}
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={Colors.light.primary}
        style={styles.progressBar}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Formik
        initialValues={{
          email: '',
          password: '',
          confirm_password: '',
          first_name: '',
          last_name: '',
          phone: '',
          specialization: '',
          license_number: '',
          years_of_experience: 0,
          education: '',
          bio: '',
          consultation_fee: 0,
        }}
        validationSchema={SignupSchema}
        onSubmit={handleSignup}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          validateForm,
          values,
          errors,
          touched,
        }) => (
          <View style={styles.formContainer}>
            {step === 1 && (
              <>
                <TextInput
                  label="Email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  mode="outlined"
                  error={touched.email && !!errors.email}
                />
                {touched.email && errors.email && (
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email}
                  </HelperText>
                )}

                <TextInput
                  label="Password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  secureTextEntry={secureTextEntry}
                  style={styles.input}
                  mode="outlined"
                  error={touched.password && !!errors.password}
                  right={
                    <TextInput.Icon
                      icon={secureTextEntry ? 'eye-off' : 'eye'}
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                    />
                  }
                />
                {touched.password && errors.password && (
                  <HelperText type="error" visible={!!errors.password}>
                    {errors.password}
                  </HelperText>
                )}

                <TextInput
                  label="Confirm Password"
                  value={values.confirm_password}
                  onChangeText={handleChange('confirm_password')}
                  onBlur={handleBlur('confirm_password')}
                  secureTextEntry={confirmSecureTextEntry}
                  style={styles.input}
                  mode="outlined"
                  error={touched.confirm_password && !!errors.confirm_password}
                  right={
                    <TextInput.Icon
                      icon={confirmSecureTextEntry ? 'eye-off' : 'eye'}
                      onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                    />
                  }
                />
                {touched.confirm_password && errors.confirm_password && (
                  <HelperText type="error" visible={!!errors.confirm_password}>
                    {errors.confirm_password}
                  </HelperText>
                )}

                <Button
                  mode="contained"
                  onPress={() => nextStep(validateForm, values)}
                  style={styles.button}
                >
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <TextInput
                  label="First Name"
                  value={values.first_name}
                  onChangeText={handleChange('first_name')}
                  onBlur={handleBlur('first_name')}
                  style={styles.input}
                  mode="outlined"
                  error={touched.first_name && !!errors.first_name}
                />
                {touched.first_name && errors.first_name && (
                  <HelperText type="error" visible={!!errors.first_name}>
                    {errors.first_name}
                  </HelperText>
                )}

                <TextInput
                  label="Last Name"
                  value={values.last_name}
                  onChangeText={handleChange('last_name')}
                  onBlur={handleBlur('last_name')}
                  style={styles.input}
                  mode="outlined"
                  error={touched.last_name && !!errors.last_name}
                />
                {touched.last_name && errors.last_name && (
                  <HelperText type="error" visible={!!errors.last_name}>
                    {errors.last_name}
                  </HelperText>
                )}

                <TextInput
                  label="Phone Number"
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  keyboardType="phone-pad"
                  style={styles.input}
                  mode="outlined"
                  error={touched.phone && !!errors.phone}
                />
                {touched.phone && errors.phone && (
                  <HelperText type="error" visible={!!errors.phone}>
                    {errors.phone}
                  </HelperText>
                )}

                <View style={styles.buttonRow}>
                  <Button mode="outlined" onPress={prevStep} style={styles.backButton}>
                    Back
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => nextStep(validateForm, values)}
                    style={styles.nextButton}
                  >
                    Next
                  </Button>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.sectionTitle}>Specialization</Text>
                <View style={styles.specializationContainer}>
                  {specializations.map((spec) => (
                    <Chip
                      key={spec}
                      selected={values.specialization === spec}
                      onPress={() => {
                        setSelectedSpecialization(spec);
                        setFieldValue('specialization', spec);
                      }}
                      style={styles.specializationChip}
                      textStyle={values.specialization === spec ? styles.selectedChipText : {}}
                    >
                      {spec}
                    </Chip>
                  ))}
                </View>
                {touched.specialization && errors.specialization && (
                  <HelperText type="error" visible={!!errors.specialization}>
                    {errors.specialization}
                  </HelperText>
                )}

                <TextInput
                  label="License Number"
                  value={values.license_number}
                  onChangeText={handleChange('license_number')}
                  onBlur={handleBlur('license_number')}
                  style={styles.input}
                  mode="outlined"
                  error={touched.license_number && !!errors.license_number}
                />
                {touched.license_number && errors.license_number && (
                  <HelperText type="error" visible={!!errors.license_number}>
                    {errors.license_number}
                  </HelperText>
                )}

                <TextInput
                  label="Years of Experience"
                  value={values.years_of_experience.toString()}
                  onChangeText={(text) => setFieldValue('years_of_experience', parseInt(text) || 0)}
                  onBlur={handleBlur('years_of_experience')}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  error={touched.years_of_experience && !!errors.years_of_experience}
                />
                {touched.years_of_experience && errors.years_of_experience && (
                  <HelperText type="error" visible={!!errors.years_of_experience}>
                    {errors.years_of_experience}
                  </HelperText>
                )}

                <TextInput
                  label="Education (Optional)"
                  value={values.education}
                  onChangeText={handleChange('education')}
                  onBlur={handleBlur('education')}
                  style={styles.input}
                  mode="outlined"
                  multiline
                />

                <TextInput
                  label="Bio (Optional)"
                  value={values.bio}
                  onChangeText={handleChange('bio')}
                  onBlur={handleBlur('bio')}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  label="Consultation Fee"
                  value={values.consultation_fee.toString()}
                  onChangeText={(text) => setFieldValue('consultation_fee', parseFloat(text) || 0)}
                  onBlur={handleBlur('consultation_fee')}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  error={touched.consultation_fee && !!errors.consultation_fee}
                />
                {touched.consultation_fee && errors.consultation_fee && (
                  <HelperText type="error" visible={!!errors.consultation_fee}>
                    {errors.consultation_fee}
                  </HelperText>
                )}

                <View style={styles.buttonRow}>
                  <Button mode="outlined" onPress={prevStep} style={styles.backButton}>
                    Back
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleSubmit()}
                    style={styles.nextButton}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="white" /> : 'Register'}
                  </Button>
                </View>
              </>
            )}
          </View>
        )}
      </Formik>

      <Divider style={styles.divider} />
      <View style={styles.loginContainer}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  progressBar: {
    marginBottom: 20,
    height: 8,
    borderRadius: 5,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  backButton: {
    flex: 1,
    marginRight: 10,
  },
  nextButton: {
    flex: 2,
  },
  button: {
    padding: 5,
    marginVertical: 10,
  },
  divider: {
    marginVertical: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.light.text,
  },
  specializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  specializationChip: {
    margin: 4,
  },
  selectedChipText: {
    fontWeight: 'bold',
  },
});