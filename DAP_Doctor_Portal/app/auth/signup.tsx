import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { TextInput, Button, ActivityIndicator, HelperText, Chip, ProgressBar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import authService, { DoctorSignupData } from '../../services/authService';
import Colors from '../../constants/Colors';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
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
    <ThemedView variant="secondary" style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formWrapper}>
          <ThemedView variant="card" useShadow style={styles.formCard}>
            <View style={styles.headerContainer}>
              <ThemedText type="heading" weight="bold" style={styles.headerTitle}>
                Doctor Registration
              </ThemedText>
              <ThemedText variant="secondary" style={styles.headerSubtitle}>
                {step === 1 && 'Step 1: Account Information'}
                {step === 2 && 'Step 2: Personal Information'}
                {step === 3 && 'Step 3: Professional Information'}
              </ThemedText>
            </View>

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: `${Colors[theme].danger}15` }]}>
                <ThemedText type="error" style={styles.errorText}>{error}</ThemedText>
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
                        right={
                          <TextInput.Icon
                            icon={secureTextEntry ? 'eye-off' : 'eye'}
                            onPress={() => setSecureTextEntry(!secureTextEntry)}
                            color={Colors[theme].icon}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
                        right={
                          <TextInput.Icon
                            icon={confirmSecureTextEntry ? 'eye-off' : 'eye'}
                            onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                            color={Colors[theme].icon}
                          />
                        }
                      />
                      {touched.confirm_password && errors.confirm_password && (
                        <HelperText type="error" visible={!!errors.confirm_password}>
                          {errors.confirm_password}
                        </HelperText>
                      )}

                      <TouchableOpacity
                        style={styles.gradientButtonContainer}
                        onPress={() => nextStep(validateForm, values)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={Colors[theme].primary === Colors.light.primary 
                            ? ['#0466C8', '#0353A4'] 
                            : ['#58B0ED', '#0466C8']}
                          style={styles.gradientButton}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <ThemedText style={styles.buttonText}>Next</ThemedText>
                        </LinearGradient>
                      </TouchableOpacity>
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
                      />
                      {touched.phone && errors.phone && (
                        <HelperText type="error" visible={!!errors.phone}>
                          {errors.phone}
                        </HelperText>
                      )}

                      <View style={styles.buttonRow}>
                        <TouchableOpacity 
                          style={styles.outlineButtonContainer}
                          onPress={prevStep}
                          activeOpacity={0.8}
                        >
                          <ThemedView style={styles.outlineButton}>
                            <ThemedText style={[styles.outlineButtonText, { color: Colors[theme].primary }]}>
                              Back
                            </ThemedText>
                          </ThemedView>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.gradientButtonContainer, styles.nextButtonContainer]}
                          onPress={() => nextStep(validateForm, values)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={Colors[theme].primary === Colors.light.primary 
                              ? ['#0466C8', '#0353A4'] 
                              : ['#58B0ED', '#0466C8']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <ThemedText style={styles.buttonText}>Next</ThemedText>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <ThemedText weight="semibold" style={styles.sectionTitle}>Specialization</ThemedText>
                      <View style={styles.specializationContainer}>
                        {specializations.map((spec) => (
                          <Chip
                            key={spec}
                            selected={values.specialization === spec}
                            onPress={() => {
                              setSelectedSpecialization(spec);
                              setFieldValue('specialization', spec);
                            }}
                            style={[
                              styles.specializationChip,
                              { 
                                backgroundColor: values.specialization === spec 
                                  ? `${Colors[theme].primary}20` 
                                  : Colors[theme].cardAlt
                              }
                            ]}
                            textStyle={[
                              values.specialization === spec && styles.selectedChipText,
                              { color: values.specialization === spec ? Colors[theme].primary : Colors[theme].text }
                            ]}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
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
                        theme={{ colors: { primary: Colors[theme].primary } }}
                        outlineColor={Colors[theme].borderLight}
                        activeOutlineColor={Colors[theme].primary}
                        textColor={Colors[theme].text}
                        placeholderTextColor={Colors[theme].textTertiary}
                      />
                      {touched.consultation_fee && errors.consultation_fee && (
                        <HelperText type="error" visible={!!errors.consultation_fee}>
                          {errors.consultation_fee}
                        </HelperText>
                      )}

                      <View style={styles.buttonRow}>
                        <TouchableOpacity 
                          style={styles.outlineButtonContainer}
                          onPress={prevStep}
                          activeOpacity={0.8}
                        >
                          <ThemedView style={styles.outlineButton}>
                            <ThemedText style={[styles.outlineButtonText, { color: Colors[theme].primary }]}>
                              Back
                            </ThemedText>
                          </ThemedView>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.gradientButtonContainer, styles.nextButtonContainer]}
                          onPress={() => handleSubmit()}
                          activeOpacity={0.8}
                          disabled={loading}
                        >
                          <LinearGradient
                            colors={Colors[theme].primary === Colors.light.primary 
                              ? ['#0466C8', '#0353A4'] 
                              : ['#58B0ED', '#0466C8']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            {loading ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <View style={styles.registerButtonContent}>
                                <FontAwesome5 name="user-md" size={16} color="#FFF" style={styles.registerIcon} />
                                <ThemedText style={styles.buttonText}>Register</ThemedText>
                              </View>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              )}
            </Formik>

            <Divider style={styles.divider} />
            <View style={styles.loginContainer}>
              <ThemedText variant="secondary">Already have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <ThemedText style={styles.loginText}>Log in</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  formWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100%',
  },
  formCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // for Android
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  progressBar: {
    marginBottom: 24,
    height: 8,
    borderRadius: 5,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  outlineButtonContainer: {
    flex: 1,
    marginRight: 12,
  },
  outlineButton: {
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontWeight: '600',
  },
  gradientButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  nextButtonContainer: {
    flex: 2,
  },
  gradientButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    marginVertical: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  specializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  specializationChip: {
    margin: 4,
    borderRadius: 20,
  },
  selectedChipText: {
    fontWeight: 'bold',
  },
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerIcon: {
    marginRight: 8,
  },
});