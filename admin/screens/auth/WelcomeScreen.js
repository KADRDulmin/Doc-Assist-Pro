import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Colors from '../../constants/Colors';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Doc-Assist Pro</Text>
        <Text style={styles.subtitle}>Your Healthcare Companion</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <Text style={styles.loginText}>Login As:</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.patientButton]}
          onPress={() => navigation.navigate('PatientLogin')}
        >
          <Text style={styles.buttonText}>Patient</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.doctorButton]}
          onPress={() => navigation.navigate('DoctorLogin')}
        >
          <Text style={styles.buttonText}>Doctor</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.buttonText}>Administrator</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('PatientRegister')}
        >
          <Text style={styles.registerText}>Register as Patient</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('DoctorRegister')}
        >
          <Text style={styles.registerText}>Register as Doctor</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary || '#0066cc',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text || '#333333',
    marginTop: 8,
  },
  buttonsContainer: {
    width: '80%',
  },
  loginText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.text || '#333333',
  },
  button: {
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  patientButton: {
    backgroundColor: Colors.primary || '#0066cc',
  },
  doctorButton: {
    backgroundColor: Colors.secondary || '#00a86b',
  },
  adminButton: {
    backgroundColor: Colors.tertiary || '#444444',
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
    color: Colors.text || '#333333',
    marginBottom: 10,
  },
  registerText: {
    fontSize: 16,
    color: Colors.primary || '#0066cc',
    fontWeight: '600',
    marginVertical: 5,
  },
});

export default WelcomeScreen;
