import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, View, Text } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/authService';
import { API_URL } from '@/services/api';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [showTestCreds, setShowTestCreds] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  // Set the API URL after component mount to avoid SSR issues
  useEffect(() => {
    setApiUrl(API_URL);
    console.log('Current environment:', process.env.NODE_ENV);
    console.log('API URL initialized as:', API_URL);
  }, []);

  const fillTestCredentials = () => {
    setEmail('test@example.com');
    setPassword('test123');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with API URL:', apiUrl);
      const response = await authService.login({ email, password });
      console.log('Login successful, navigating to home screen...');
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Check for specific error cases and provide helpful messages
      if (errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
        if (isDev) {
          errorMessage += '\n\nTry the test account:\nEmail: test@example.com\nPassword: test123';
        }
      } else if (errorMessage.includes('Network error')) {
        errorMessage += '\n\nTips:\n1. Check if your backend server is running\n' + 
                       `2. Make sure ${apiUrl} is accessible from your device`;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Doc-Assist-Pro</ThemedText>
      <ThemedText style={styles.subtitle}>Login to your account</ThemedText>

      {isDev && (
        <TouchableOpacity 
          style={styles.devBanner}
          onPress={() => {
            setShowTestCreds(!showTestCreds);
            if (!showTestCreds) fillTestCredentials();
          }}
        >
          <ThemedText style={styles.devText}>
            Development Mode{showTestCreds ? ' - Test Credentials Applied' : ' (Tap for test account)'}
          </ThemedText>
          <ThemedText style={styles.devApiUrl}>API: {apiUrl}</ThemedText>
        </TouchableOpacity>
      )}

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

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>Login</ThemedText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/register')}
        style={styles.linkContainer}
      >
        <ThemedText style={styles.link}>Don't have an account? Register</ThemedText>
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