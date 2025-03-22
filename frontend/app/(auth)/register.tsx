import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/authService';
import { API_URL } from '@/services/api';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  // Store API URL in state to avoid SSR issues
  const [apiUrl, setApiUrl] = useState('');

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

  const handleRegister = async () => {
    // Validate inputs
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Check if server is online
    if (serverStatus !== 'online') {
      Alert.alert(
        'Server Unavailable',
        `Cannot connect to the server at ${API_URL}. Please check your connection and try again.`
      );
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting registration with API URL:', API_URL);
      await authService.register({ email, password });
      
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
                       `2. Make sure ${API_URL} is accessible from your device`;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
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
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, serverStatus === 'offline' && styles.disabledButton]}
        onPress={handleRegister}
        disabled={loading || serverStatus === 'offline'}
      >
        {loading ? (
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
});