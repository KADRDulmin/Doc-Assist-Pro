import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, View, Text } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/src/hooks/useAuth';
import { API_URL } from '@/src/services/api/base-api.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [showTestCreds, setShowTestCreds] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Use our custom auth hook
  const { isLoading, error, login } = useAuth();

  // Set the API URL after component mount to avoid SSR issues
  useEffect(() => {
    setApiUrl(API_URL);
    console.log('Current environment:', process.env.NODE_ENV);
    console.log('API URL initialized as:', API_URL);
  }, []);

  const fillTestCredentials = () => {
    setEmail('test@example.com');
    setPassword('test123');
    setErrors({ email: '', password: '' });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const success = await login({ email, password });
      
      if (success) {
        console.log('Login successful, navigating to home screen...');
        router.replace('/(tabs)');
      } else if (error) {
        displayErrorAlert(error);
      }
    } catch (err) {
      console.error('Login error:', err);
      displayErrorAlert('An unexpected error occurred');
    }
  };

  const displayErrorAlert = (errorMessage: string) => {
    let message = errorMessage;
    
    // Check for specific error cases and provide helpful messages
    if (errorMessage.includes('Invalid credentials')) {
      message = 'Invalid email or password. Please try again.';
      if (isDev) {
        message += '\n\nTry the test account:\nEmail: test@example.com\nPassword: test123';
      }
    } else if (errorMessage.includes('Network error')) {
      message += '\n\nTips:\n1. Check if your backend server is running\n' + 
                `2. Make sure ${apiUrl} is accessible from your device`;
    }
    
    Alert.alert('Login Failed', message);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Doc-Assist-Pro</ThemedText>
      <ThemedText style={styles.subtitle}>Patient Login</ThemedText>



      <TextInput
        style={[styles.input, errors.email ? styles.inputError : null]}
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({...errors, email: ''});
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email ? <ThemedText style={styles.errorText}>{errors.email}</ThemedText> : null}

      <TextInput
        style={[styles.input, errors.password ? styles.inputError : null]}
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({...errors, password: ''});
        }}
        secureTextEntry
      />
      {errors.password ? <ThemedText style={styles.errorText}>{errors.password}</ThemedText> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>Login as Patient</ThemedText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/register')}
        style={styles.linkContainer}
      >
        <ThemedText style={styles.link}>New patient? Create an account</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff3b30',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: -15,
    marginBottom: 15,
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#0a7ea4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: '#0a7ea4',
    fontSize: 16,
  },
  devBanner: {
    backgroundColor: '#ffe8e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  devText: {
    color: '#d63600',
    fontSize: 14,
    fontWeight: 'bold',
  },
  devApiUrl: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  }
});