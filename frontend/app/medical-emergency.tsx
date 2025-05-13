import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  View, 
  Text, 
  ScrollView,
  Platform,
  Linking,
  Alert,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function MedicalEmergencyScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();

  // Animation reference
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get params data from symptom analysis
  const symptomsFromParams = params.symptoms ? String(params.symptoms) : '';
  const possibleIllness1FromParams = params.possibleIllness1 ? String(params.possibleIllness1) : '';
  const possibleIllness2FromParams = params.possibleIllness2 ? String(params.possibleIllness2) : '';
  const recommendedSpecialty1FromParams = params.recommendedSpecialty1 ? String(params.recommendedSpecialty1) : '';
  const recommendedSpecialty2FromParams = params.recommendedSpecialty2 ? String(params.recommendedSpecialty2) : '';
  const criticalityFromParams = params.criticality ? String(params.criticality) : '';
  const explanationFromParams = params.explanation ? String(params.explanation) : '';

  // Define constant for emergency number
  const EMERGENCY_NUMBER = '1990';

  // Define fixed gradient colors for LinearGradient based on theme
  const headerGradientDark = ['#B71C1C', '#5f0000'] as const;
  const headerGradientLight = ['#F44336', '#b71c1c'] as const;

  // Start the pulsing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Trigger haptic feedback on load to alert user this is important
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const handleEmergencyCall = async () => {
    try {
      // Play haptic feedback before initiating call
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Small delay to allow haptic to complete
      setTimeout(async () => {
        const url = `tel:${EMERGENCY_NUMBER}`;
        const canOpen = await Linking.canOpenURL(url);
        
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot initiate emergency call. Please dial 1990 manually.');
        }
      }, 200);
    } catch (error) {
      console.error('Error making emergency call:', error);
      Alert.alert('Error', 'Failed to make emergency call. Please dial 1990 manually.');
    }
  };
  const handleBookAppointment = () => {
    // Navigate to appointment booking with the symptom analysis data
    // Add an emergency flag to ensure it's marked as an emergency appointment
    router.push({
      pathname: '/new-appointment',
      params: {
        symptoms: symptomsFromParams,
        possibleIllness1: possibleIllness1FromParams,
        possibleIllness2: possibleIllness2FromParams,
        recommendedSpecialty1: recommendedSpecialty1FromParams,
        recommendedSpecialty2: recommendedSpecialty2FromParams,
        criticality: criticalityFromParams,
        explanation: explanationFromParams,
        forceEmergencyAppointment: 'true' // Add this flag
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDarkMode ? '#151718' : '#f8f8f8'}]}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? headerGradientDark : headerGradientLight}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MEDICAL EMERGENCY</Text>
          <View style={{width: 24}} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >        <View style={styles.emergencyContainer}>
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Ionicons name="warning" size={80} color="#B71C1C" />
          </Animated.View>
          
          <ThemedText style={styles.emergencyTitle}>
            Medical Emergency Detected
          </ThemedText>
          
          <ThemedText style={styles.emergencyDescription}>
            Based on your symptom analysis, your condition requires immediate medical attention. 
            Please contact emergency services right away.
          </ThemedText>
          
          {possibleIllness1FromParams && (
            <ThemedView style={styles.alertInfoBox}>
              <ThemedText style={styles.alertInfoTitle}>Possible conditions:</ThemedText>
              <ThemedText style={styles.alertInfoContent}>
                {possibleIllness1FromParams}
                {possibleIllness2FromParams ? `, ${possibleIllness2FromParams}` : ''}
              </ThemedText>
              
              {explanationFromParams && (
                <>
                  <ThemedText style={[styles.alertInfoTitle, {marginTop: 10}]}>
                    Additional information:
                  </ThemedText>
                  <ThemedText style={styles.alertInfoContent}>
                    {explanationFromParams}
                  </ThemedText>
                </>
              )}
            </ThemedView>
          )}
            <TouchableOpacity 
            style={styles.emergencyCallButton}
            onPress={handleEmergencyCall}
            activeOpacity={0.7}
          >
            <View style={styles.callButtonInner}>
              <Ionicons name="call-sharp" size={28} color="#fff" style={styles.buttonIcon} />
              <View>
                <Text style={styles.emergencyCallButtonText}>
                  Call Emergency Services
                </Text>
                <Text style={styles.emergencyCallButtonSubText}>
                  1990
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <ThemedText style={styles.orDivider}>OR</ThemedText>
          
          <TouchableOpacity 
            style={styles.appointmentButton}
            onPress={handleBookAppointment}
          >
            <Ionicons name="calendar" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.appointmentButtonText}>
              Schedule Emergency Appointment
            </Text>
          </TouchableOpacity>
          
          <ThemedText style={styles.disclaimer}>
            IMPORTANT: If you are experiencing severe symptoms such as difficulty breathing, 
            severe chest pain, sudden weakness, or other life-threatening conditions, 
            call emergency services immediately.
          </ThemedText>
        </View>
      </ScrollView>
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emergencyContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#B71C1C',
  },
  emergencyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  alertInfoBox: {
    width: '100%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#B71C1C',
  },
  alertInfoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  alertInfoContent: {
    fontSize: 16,
    lineHeight: 22,
  },  emergencyCallButton: {
    backgroundColor: '#B71C1C',
    width: '100%',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyCallButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyCallButtonSubText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  orDivider: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  appointmentButton: {
    backgroundColor: '#0a7ea4',
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  appointmentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
    marginTop: 10,
  },
});
