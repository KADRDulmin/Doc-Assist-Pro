import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ScrollView } from 'react-native';
import { API_BASE_URL, API_PREFIX } from '@/config/api';

export default function ApiDebug() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('doctor@example.com');
  const [password, setPassword] = useState('test123');

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch the health endpoint
      const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health`);
      const data = await response.json();
      
      setResponse(data);
    } catch (err) {
      // Type-safe error handling
      if (err instanceof Error) {
        setError(`Connection failed: ${err.message}`);
      } else {
        setError(`Connection failed: ${String(err)}`);
      }
      console.error('API test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct fetch without apiFetch to bypass any app-specific logic
      const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });
      
      const data = await response.json();
      setResponse(data);
      
      if (!response.ok) {
        setError(`Login failed: ${data.error || response.statusText}`);
      }
    } catch (err) {
      // Type-safe error handling
      if (err instanceof Error) {
        setError(`Login failed: ${err.message}`);
      } else {
        setError(`Login failed: ${String(err)}`);
      }
      console.error('Login test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Debug</Text>
      
      <Text style={styles.label}>API URL:</Text>
      <Text>{API_BASE_URL}{API_PREFIX}</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username:</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Test Connection" 
          onPress={testConnection} 
          disabled={loading}
        />
        <Button 
          title="Test Login" 
          onPress={testLogin} 
          disabled={loading}
        />
      </View>
      
      {loading && <Text>Loading...</Text>}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {response && (
        <ScrollView style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Response:</Text>
          <Text>{JSON.stringify(response, null, 2)}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inputContainer: {
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
  },
  errorText: {
    color: '#c62828',
  },
  responseContainer: {
    marginTop: 16,
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  responseTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
