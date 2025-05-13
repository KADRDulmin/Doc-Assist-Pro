import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import symptomAnalysisService, { SymptomAnalysisResult } from '@/src/services/symptomAnalysis.service';
import doctorService from '@/src/services/doctor.service';
import appointmentService from '@/src/services/appointment.service';

export default function SymptomAnalysisScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDarkMode = colorScheme === 'dark';
  
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [matchingDoctors, setMatchingDoctors] = useState<any[]>([]);
  const [step, setStep] = useState<'input' | 'results' | 'appointment'>('input');

  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  // Handle symptom analysis
  const handleAnalyze = async () => {
    if (!symptoms.trim() || symptoms.trim().length < 10) {
      setError('Please provide a detailed description of your symptoms (at least 10 characters)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the symptom analysis service
      const result = await symptomAnalysisService.analyzeSymptoms(symptoms.trim());
        if (result.success && result.data) {
        setAnalysisResult(result.data);
        
        // If criticality is Emergency, redirect to medical emergency screen
        if (result.data.criticality === 'Emergency') {
          router.push({
            pathname: '/medical-emergency',
            params: {
              symptoms,
              possibleIllness1: result.data.possibleIllness1,
              possibleIllness2: result.data.possibleIllness2,
              recommendedSpecialty1: result.data.recommendedDoctorSpeciality1,
              recommendedSpecialty2: result.data.recommendedDoctorSpeciality2,
              criticality: result.data.criticality,
              explanation: result.data.explanation
            }
          });
          return;
        }
        
        // For non-emergency cases, move to results step
        setStep('results');
        
        // Find matching doctors based on specialties
        await findMatchingDoctors(result.data.recommendedDoctorSpeciality1, result.data.recommendedDoctorSpeciality2);
      } else {
        setError(result.message || 'Failed to analyze symptoms. Please try again.');
      }
    } catch (err: any) {
      console.error('Error analyzing symptoms:', err);
      setError(err?.message || 'An unexpected error occurred while analyzing symptoms');
    } finally {
      setLoading(false);
    }
  };

  // Find doctors matching the recommended specialties
  const findMatchingDoctors = async (specialty1: string, specialty2: string) => {
    setDoctorsLoading(true);
    
    try {
      // Try to find doctors with the first specialty using the specialized endpoint
      let result = await doctorService.findDoctorsBySpecialty(specialty1);
      
      if (!result.success || result.data.length === 0) {
        // If no doctors found with first specialty, try the second specialty
        if (specialty2) {
          result = await doctorService.findDoctorsBySpecialty(specialty2);
        }
      }
      
      // If specialized search failed, fall back to general doctor search
      if (!result.success || result.data.length === 0) {
        result = await doctorService.getAllDoctors();
        
        if (result.success) {
          // Filter doctors based on specialization
          const filteredDoctors = result.data.filter(doctor => 
            doctor.specialization?.toLowerCase().includes(specialty1.toLowerCase()) ||
            (specialty2 && doctor.specialization?.toLowerCase().includes(specialty2.toLowerCase()))
          );
          
          if (filteredDoctors.length > 0) {
            setMatchingDoctors(filteredDoctors);
          } else {
            // No matching doctors found, show all doctors
            setMatchingDoctors(result.data);
          }
        } else {
          console.warn('Failed to fetch doctors:', result.message);
        }
      } else {
        // Use the doctors returned by the specialized endpoint
        setMatchingDoctors(result.data);
      }
    } catch (err: any) {
      console.error('Error finding matching doctors:', err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  // Calculate the color for the criticality badge
  const getCriticalityColor = (criticality?: string) => {
    switch (criticality) {
      case 'Low': return { bg: '#4CAF50', text: '#fff' };
      case 'Medium': return { bg: '#FF9800', text: '#fff' };
      case 'High': return { bg: '#F44336', text: '#fff' };
      case 'Emergency': return { bg: '#B71C1C', text: '#fff' };
      default: return { bg: '#9E9E9E', text: '#fff' };
    }
  };
  // Handle selecting a doctor and creating an appointment
  const handleSelectDoctor = async (doctorId: number) => {
    if (!analysisResult || !symptoms) return;

    try {
      // If criticality is Emergency, redirect to medical emergency screen
      if (analysisResult.criticality === 'Emergency') {
        router.push({
          pathname: '/medical-emergency',
          params: {
            symptoms,
            possibleIllness1: analysisResult.possibleIllness1,
            possibleIllness2: analysisResult.possibleIllness2,
            recommendedSpecialty1: analysisResult.recommendedDoctorSpeciality1,
            recommendedSpecialty2: analysisResult.recommendedDoctorSpeciality2,
            criticality: analysisResult.criticality,
            explanation: analysisResult.explanation
          }
        });
        return;
      }
      
      // For non-emergency cases, navigate to the appointment booking page
      router.push({
        pathname: '/new-appointment',
        params: {
          doctorId: String(doctorId),
          symptoms,
          possibleIllness1: analysisResult.possibleIllness1,
          possibleIllness2: analysisResult.possibleIllness2,
          recommendedSpecialty1: analysisResult.recommendedDoctorSpeciality1,
          recommendedSpecialty2: analysisResult.recommendedDoctorSpeciality2,
          criticality: analysisResult.criticality,
          explanation: analysisResult.explanation
        }
      });
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      Alert.alert('Error', 'Failed to create appointment. Please try again.');
    }
  };
  
  // Handle going back to symptom input
  const handleBackToInput = () => {
    setStep('input');
    setAnalysisResult(null);
  };

  // Symptom Input Step
  const renderSymptomInput = () => (
    <>
      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>
          Describe Your Symptoms
        </ThemedText>
        <TextInput
          style={[
            styles.textInput,
            isDarkMode && { backgroundColor: '#2c3e50', color: '#fff', borderColor: '#34495e' }
          ]}
          placeholder="Please describe your symptoms in detail..."
          placeholderTextColor={isDarkMode ? '#78909c' : '#90a4ae'}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          value={symptoms}
          onChangeText={setSymptoms}
        />
        
        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}
        
        <View style={styles.exampleContainer}>
          <ThemedText style={styles.exampleTitle}>Example:</ThemedText>
          <ThemedText style={styles.exampleText}>
            "I've been experiencing a persistent headache for the past 3 days, mostly on the right side. 
            The pain is throbbing and gets worse when I move suddenly. I also feel nauseous and sensitive to light."
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.analyzeButton, 
            symptoms.trim().length < 10 && styles.disabledButton
          ]}
          onPress={handleAnalyze}
          disabled={symptoms.trim().length < 10 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.analyzeButtonText}>Analyze Symptoms</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ThemedText style={styles.disclaimer}>
        Note: This analysis is not a diagnosis. Always consult with a healthcare professional for proper medical advice.
      </ThemedText>
    </>
  );
  
  // Analysis Results Step
  const renderAnalysisResults = () => (
    <>
      {analysisResult && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <View style={[
              styles.criticalityBadge, 
              { backgroundColor: getCriticalityColor(analysisResult.criticality).bg }
            ]}>
              <ThemedText style={styles.criticalityText}>
                {analysisResult.criticality} Severity
              </ThemedText>
            </View>
          </View>          {analysisResult.criticality === 'Emergency' && (
            <View style={styles.emergencyAlert}>
              <View style={styles.emergencyAlertRow}>
                <Ionicons name="alert-circle" size={24} color="#fff" />
                <View style={styles.emergencyAlertContent}>
                  <ThemedText style={styles.emergencyText}>
                    This appears to be a medical emergency! Immediate medical attention is recommended.
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.emergencyAlertButton}
                    onPress={() => router.push({
                      pathname: '/medical-emergency',
                      params: {
                        symptoms,
                        possibleIllness1: analysisResult.possibleIllness1,
                        possibleIllness2: analysisResult.possibleIllness2,
                        recommendedSpecialty1: analysisResult.recommendedDoctorSpeciality1,
                        recommendedSpecialty2: analysisResult.recommendedDoctorSpeciality2,
                        criticality: analysisResult.criticality,
                        explanation: analysisResult.explanation
                      }
                    })}
                  >
                    <Ionicons name="call" size={14} color="#fff" style={{marginRight: 4}} />
                    <Text style={styles.emergencyAlertButtonText}>Emergency Services</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.resultSection}>
            <ThemedText style={styles.sectionTitle}>Possible Conditions:</ThemedText>
            <View style={styles.conditionItem}>
              <Ionicons name="medical" size={18} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.conditionText}>{analysisResult.possibleIllness1}</ThemedText>
            </View>
            <View style={styles.conditionItem}>
              <Ionicons name="medical" size={18} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.conditionText}>{analysisResult.possibleIllness2}</ThemedText>
            </View>
          </View>
          
          <View style={styles.resultSection}>
            <ThemedText style={styles.sectionTitle}>Recommended Specialists:</ThemedText>
            <View style={styles.conditionItem}>
              <Ionicons name="person" size={18} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.conditionText}>{analysisResult.recommendedDoctorSpeciality1}</ThemedText>
            </View>
            <View style={styles.conditionItem}>
              <Ionicons name="person" size={18} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.conditionText}>{analysisResult.recommendedDoctorSpeciality2}</ThemedText>
            </View>
          </View>
          
          <ThemedView style={styles.explanationBox}>
            <ThemedText style={styles.explanationTitle}>Analysis:</ThemedText>
            <ThemedText style={styles.explanationText}>{analysisResult.explanation}</ThemedText>
          </ThemedView>

          {/* Matching Doctors Section */}
          <ThemedText style={styles.matchingDoctorsTitle}>
            Recommended Doctors
          </ThemedText>
          
          {doctorsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.loadingText}>Finding doctors for you...</ThemedText>
            </View>
          ) : matchingDoctors.length > 0 ? (
            <View style={styles.doctorsList}>
              {matchingDoctors.slice(0, 4).map(doctor => (
                <TouchableOpacity 
                  key={doctor.id} 
                  style={[
                    styles.doctorCard,
                    // Highlight doctors that match the recommended specialties
                    (doctor.specialization?.toLowerCase().includes(analysisResult.recommendedDoctorSpeciality1.toLowerCase()) || 
                     doctor.specialization?.toLowerCase().includes(analysisResult.recommendedDoctorSpeciality2.toLowerCase())) && 
                    styles.matchingDoctorCard
                  ]}
                  onPress={() => handleSelectDoctor(doctor.id)}
                >
                  <View style={styles.doctorInfo}>
                    <View style={styles.doctorAvatar}>
                      <Ionicons name="person-circle" size={40} color={isDarkMode ? '#A1CEDC' : '#0a7ea4'} />
                    </View>
                    <View style={styles.doctorDetails}>
                      <ThemedText style={styles.doctorName}>
                        Dr. {doctor.user?.first_name} {doctor.user?.last_name}
                      </ThemedText>
                      <View style={styles.specialtyContainer}>
                        <ThemedText style={styles.doctorSpeciality}>
                          {doctor.specialization}
                        </ThemedText>
                        {/* Show matching tag if doctor specialization matches recommended specialty */}
                        {(doctor.specialization?.toLowerCase().includes(analysisResult.recommendedDoctorSpeciality1.toLowerCase()) || 
                          doctor.specialization?.toLowerCase().includes(analysisResult.recommendedDoctorSpeciality2.toLowerCase())) && (
                          <View style={styles.matchingBadge}>
                            <Text style={styles.matchingBadgeText}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.appointmentButton}
                        onPress={() => handleSelectDoctor(doctor.id)}
                      >
                        <Text style={styles.appointmentButtonText}>Book Appointment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {matchingDoctors.length > 4 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => router.push({
                    pathname: '/doctors',
                    params: {
                      specialization: analysisResult.recommendedDoctorSpeciality1
                    }
                  })}
                >
                  <Text style={styles.viewMoreButtonText}>View More Doctors</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noMatchingDoctors}>
              <ThemedText style={styles.noMatchingDoctorsText}>
                No matching doctors found. You can still book an appointment with any available doctor.
              </ThemedText>
              <TouchableOpacity 
                style={styles.browseAllButton}
                onPress={() => router.push('/doctors')}
              >
                <Text style={styles.browseAllButtonText}>Browse All Doctors</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleBackToInput}
            >
              <Text style={styles.secondaryButtonText}>Back to Symptoms</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/new-appointment')}
            >
              <Text style={styles.primaryButtonText}>New Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
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
          <ThemedText style={styles.headerTitle}>Symptom Analysis</ThemedText>
          <View style={{width: 24}} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'input' && renderSymptomInput()}
        {step === 'results' && renderAnalysisResults()}
      </ScrollView>

      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

// Styles remain unchanged
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 10,
  },
  errorText: {
    color: '#f44336',
    marginTop: 4,
    marginBottom: 10,
  },
  exampleContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  exampleTitle: {
    fontWeight: '600',
    marginBottom: 5,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  analyzeButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  criticalityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  criticalityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },  emergencyAlert: {
    backgroundColor: '#B71C1C',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  emergencyAlertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emergencyAlertContent: {
    flex: 1,
    marginLeft: 8,
  },
  emergencyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  emergencyAlertButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyAlertButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  resultSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  explanationBox: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    lineHeight: 22,
  },
  matchingDoctorsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.7,
  },
  doctorsList: {
    marginBottom: 20,
  },
  doctorCard: {
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  matchingDoctorCard: {
    borderColor: '#0a7ea4',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    marginRight: 12,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  doctorSpeciality: {
    fontSize: 14,
    opacity: 0.7,
    marginRight: 6,
  },
  matchingBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchingBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  appointmentButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  appointmentButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 5,
  },
  viewMoreButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  noMatchingDoctors: {
    alignItems: 'center',
    marginVertical: 20,
  },
  noMatchingDoctorsText: {
    textAlign: 'center',
    marginBottom: 15,
  },
  browseAllButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseAllButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});