import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

// Login form validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, authError } = useAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  // Update error message when auth context error changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await signIn(values.email, values.password);
      
      if (success) {
        // Navigation will be handled by AuthContext
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container} variant="secondary">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={Colors[theme].primary === Colors.light.primary 
                ? ['#0466C8', '#0353A4'] 
                : ['#58B0ED', '#0466C8']}
              style={styles.logoBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="user-md" size={60} color="#FFFFFF" />
            </LinearGradient>
            <ThemedText type="heading" style={styles.appName}>Doc-Assist Pro</ThemedText>
            <ThemedText variant="secondary" style={styles.portalName}>Doctor Portal</ThemedText>
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colorScheme === 'dark' ? '#3F2021' : '#FFEBEE' }]}>
              <FontAwesome5 name="exclamation-circle" size={20} color={Colors[theme].danger} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: Colors[theme].danger }]}>{error}</Text>
            </View>
          )}

          <ThemedView 
            variant="card" 
            useShadow 
            style={styles.formCard}
          >
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View style={styles.formContainer}>
                  <ThemedText type="subheading" style={styles.formTitle}>
                    Welcome Back
                  </ThemedText>
                  
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
                    outlineColor={Colors[theme].border}
                    activeOutlineColor={Colors[theme].primary}
                    textColor={Colors[theme].text}
                    theme={{ 
                      colors: { 
                        background: Colors[theme].card,
                        placeholder: Colors[theme].textTertiary
                      }
                    }}
                    left={
                      <TextInput.Icon
                        icon="email"
                        color={Colors[theme].icon}
                      />
                    }
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
                    outlineColor={Colors[theme].border}
                    activeOutlineColor={Colors[theme].primary}
                    textColor={Colors[theme].text}
                    theme={{ 
                      colors: { 
                        background: Colors[theme].card,
                        placeholder: Colors[theme].textTertiary
                      }
                    }}
                    left={
                      <TextInput.Icon
                        icon="lock"
                        color={Colors[theme].icon}
                      />
                    }
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

                  <TouchableOpacity 
                    style={styles.forgotPassword}
                    onPress={() => Alert.alert('Reset Password', 'Please contact support to reset your password.')}
                  >
                    <ThemedText variant="tertiary" style={styles.forgotPasswordText}>
                      Forgot Password?
                    </ThemedText>
                  </TouchableOpacity>

                  <Button
                    mode="contained"
                    onPress={() => handleSubmit()}
                    style={styles.button}
                    buttonColor={Colors[theme].primary}
                    textColor="#FFFFFF"
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>

                  <View style={styles.signupContainer}>
                    <ThemedText variant="secondary">
                      Don't have an account?{' '}
                    </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                      <Text style={[styles.signupText, { color: Colors[theme].primary }]}>
                        Sign up
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>
          </ThemedView>
          
          <ThemedText 
            variant="tertiary" 
            style={styles.versionText}
          >
            Doc-Assist Pro v1.0.0
          </ThemedText>
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
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  portalName: {
    fontSize: 18,
    marginTop: 5,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  formTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontWeight: '500',
  },
  button: {
    padding: 5,
    marginVertical: 10,
    borderRadius: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    flex: 1,
  },
  versionText: {
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
  },
});