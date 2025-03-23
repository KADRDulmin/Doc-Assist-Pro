import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/src/hooks/useAuth';
import { API_URL } from '@/src/services/api/base-api.service';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [errors, setErrors] = useState({ email: '', password: '', confirmPassword: '' });
  
  // Store API URL in state to avoid SSR issues
  const [apiUrl, setApiUrl] = useState('');
  
  // Use our auth hook
  const { isLoading, register } = useAuth();

  // Use effect to set API URL and check server status after mount
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

    // Only run server check after component has mounted
    checkServerStatus();
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', confirmPassword: '' };

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

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!validateForm()) {
      return;
    }

    // Check if server is online
    if (serverStatus !== 'online') {
      Alert.alert(
        'Server Unavailable',
        `Cannot connect to the server at ${apiUrl}. Please check your connection and try again.`
      );
      return;
    }

    try {
      console.log('Attempting registration...');
      await register({ email, password });
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully. Please login.',
        [{ text: 'Login', onPress: () => router.push('/(auth)/login') }]
      );
    } catch (error) {
      console.error('Registration failed:', error);
      let errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      // Handle specific errors
      if (errorMessage.includes('already exists')) {
        errorMessage = 'This email is already registered. Please try logging in instead.';
      } else if (errorMessage.includes('Network error')) {
        errorMessage += '\n\nTips:\n1. Check if your backend server is running\n' + 
                       `2. Make sure ${apiUrl} is accessible from your device`;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {serverStatus === 'offline' && (
        <ThemedView style={styles.offlineBar}>
          <ThemedText style={styles.offlineText}>
            Server is offline. Please check your connection.
          </ThemedText>
        </ThemedView>
      )}

      <ThemedText type="title" style={styles.title}>Doc-Assist-Pro</ThemedText>
      <ThemedText style={styles.subtitle}>Create a new account</ThemedText>

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

      <TextInput
        style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
        }}
        secureTextEntry
      />
      {errors.confirmPassword ? <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText> : null}

      <TouchableOpacity
        style={[styles.button, serverStatus === 'offline' && styles.disabledButton]}
        onPress={handleRegister}
        disabled={isLoading || serverStatus === 'offline'}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>Register</ThemedText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        style={styles.linkContainer}
      >
        <ThemedText style={styles.link}>Already have an account? Login</ThemedText>
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
  offlineBar: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  offlineText: {
    color: '#721c24',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
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
});