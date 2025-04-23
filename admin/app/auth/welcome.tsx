import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';

// Use constants directly instead of importing from a module
const Colors = {
  primary: '#0066cc',
  secondary: '#00a86b',
  tertiary: '#444444',
  background: '#f8f9fa',
  text: '#333333',
};

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>Doc-Assist Pro</Text>
        <Text style={styles.subtitle}>Your Healthcare Companion</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <Text style={styles.loginText}>Login As:</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.patientButton]}
          onPress={() => router.push('/auth/patient-login')}
        >
          <Text style={styles.buttonText}>Patient</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.doctorButton]}
          onPress={() => router.push('/auth/doctor-login')}
        >
          <Text style={styles.buttonText}>Doctor</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => router.push('/auth/admin-login')}
        >
          <Text style={styles.buttonText}>Administrator</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/patient-register')}
        >
          <Text style={styles.registerText}>Register as Patient</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/auth/doctor-register')}
        >
          <Text style={styles.registerText}>Register as Doctor</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text,
    marginTop: 8,
  },
  buttonsContainer: {
    width: '80%',
  },
  loginText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.text,
  },
  button: {
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  patientButton: {
    backgroundColor: Colors.primary,
  },
  doctorButton: {
    backgroundColor: Colors.secondary,
  },
  adminButton: {
    backgroundColor: Colors.tertiary,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 10,
  },
  registerText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginVertical: 5,
  },
});
