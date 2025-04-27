import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';

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
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/react-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Doc-Assist Pro</Text>
        <Text style={styles.portalName}>Doctor Portal</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => Alert.alert('Reset Password', 'Please contact support to reset your password.')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={() => handleSubmit()}
              style={styles.button}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.light.background} /> : 'Login'}
            </Button>

            <View style={styles.signupContainer}>
              <Text>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.signupText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: Colors.light.primary,
  },
  portalName: {
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.light.primary,
  },
  button: {
    padding: 5,
    marginVertical: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
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
});