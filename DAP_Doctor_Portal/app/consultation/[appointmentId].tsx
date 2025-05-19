import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import doctorService, { 
  ConsultationData, 
  AppointmentData 
} from '../../services/doctorService';
import uploadService from '../../services/uploadService';

enum ConsultationStep {
  LOADING,
  PATIENT_INFO,
  MEDICAL_DIAGNOSIS,
  PRESCRIPTION,
  COMPLETION
}

export default function ConsultationScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [currentStep, setCurrentStep] = useState<ConsultationStep>(ConsultationStep.LOADING);
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  
  // Diagnosis states
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisImage, setDiagnosisImage] = useState<string | undefined>(undefined);
  const [uploadingDiagnosisImage, setUploadingDiagnosisImage] = useState(false);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  
  // Prescription states
  const [prescription, setPrescription] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState<string | undefined>(undefined);
  const [uploadingPrescriptionImage, setUploadingPrescriptionImage] = useState(false);
  const [durationDays, setDurationDays] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  
  // Status states
  const [submitting, setSubmitting] = useState(false);

  // Load appointment and start consultation when component mounts
  useEffect(() => {
    if (token && appointmentId) {
      loadAppointmentAndStartConsultation();
    }
  }, [token, appointmentId]);

  const loadAppointmentAndStartConsultation = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch appointment details
      const appointmentResponse = await doctorService.getAppointments(
        token,
        undefined,
        undefined
      );

      if (!appointmentResponse.success) {
        throw new Error(appointmentResponse.error || 'Failed to load appointment');
      }

      if (!appointmentResponse.data) {
        throw new Error('No appointment data returned');
      }

      const foundAppointment = appointmentResponse.data.find(
        (apt) => apt.id === Number(appointmentId)
      );

      if (!foundAppointment) {
        throw new Error('Appointment not found');
      }

      setAppointment(foundAppointment);

      // Check for existing consultation or create a new one
      const consultationResponse = await doctorService.getConsultationByAppointment(
        Number(appointmentId),
        token
      );

      if (consultationResponse.success && consultationResponse.data) {
        // Existing consultation found
        setConsultation(consultationResponse.data);
      } else {
        // Create a new consultation
        const startResponse = await doctorService.startConsultation(
          Number(appointmentId),
          token
        );

        if (!startResponse.success) {
          throw new Error(startResponse.error || 'Failed to start consultation');
        }

        // Only set the consultation if data is available
        if (startResponse.data) {
          setConsultation(startResponse.data);
        }
      }

      // Move to patient info step
      setCurrentStep(ConsultationStep.PATIENT_INFO);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      Alert.alert('Error', err.message || 'Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (
    setImageFunction: React.Dispatch<React.SetStateAction<string | undefined>>,
    isForDiagnosis: boolean = false
  ) => {
    try {
      // Check if token is available
      if (!token) {
        Alert.alert('Authentication Error', 'You are not authenticated. Please log in again.');
        return;
      }

      // Request permissions first
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to your media library');
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        if (isForDiagnosis) {
          setUploadingDiagnosisImage(true);
        } else {
          setUploadingPrescriptionImage(true);
        }
        
        try {
          // Upload the image directly - token is guaranteed to be a string here
          const uploadResponse = isForDiagnosis
            ? await uploadService.uploadMedicalRecordImage(selectedImage.uri, token)
            : await uploadService.uploadPrescriptionImage(selectedImage.uri, token);
          
          if (!uploadResponse.success || !uploadResponse.data) {
            throw new Error(uploadResponse.error || 'Failed to upload image');
          }
          
          // Set the image URL returned from the server
          setImageFunction(uploadResponse.data.fileUrl);
        } catch (error: unknown) {
          console.error('Error uploading image:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload the image';
          Alert.alert('Upload Error', errorMessage);
        } finally {
          if (isForDiagnosis) {
            setUploadingDiagnosisImage(false);
          } else {
            setUploadingPrescriptionImage(false);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error picking image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to select image';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case ConsultationStep.PATIENT_INFO:
        setCurrentStep(ConsultationStep.MEDICAL_DIAGNOSIS);
        break;
      case ConsultationStep.MEDICAL_DIAGNOSIS:
        if (!diagnosis && !diagnosisImage) {
          Alert.alert('Required Field', 'Please enter a diagnosis or upload a diagnosis image');
          return;
        }
        setCurrentStep(ConsultationStep.PRESCRIPTION);
        break;
      case ConsultationStep.PRESCRIPTION:
        if (!prescription && !prescriptionImage) {
          Alert.alert('Required Field', 'Please enter a prescription or upload a prescription image');
          return;
        }
        setCurrentStep(ConsultationStep.COMPLETION);
        break;
      default:
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case ConsultationStep.MEDICAL_DIAGNOSIS:
        setCurrentStep(ConsultationStep.PATIENT_INFO);
        break;
      case ConsultationStep.PRESCRIPTION:
        setCurrentStep(ConsultationStep.MEDICAL_DIAGNOSIS);
        break;
      case ConsultationStep.COMPLETION:
        setCurrentStep(ConsultationStep.PRESCRIPTION);
        break;
      default:
        break;
    }
  };

  const handleSubmitConsultation = async (status: 'completed' | 'missed') => {
    if (status === 'completed' && (!diagnosis && !diagnosisImage) && (!prescription && !prescriptionImage)) {
      Alert.alert('Required Fields', 'Please provide either diagnosis or prescription information before completing');
      return;
    }

    try {
      setSubmitting(true);

      if (!consultation?.id) {
        throw new Error('Consultation data is missing');
      }

      if (!token) {
        throw new Error('Authentication token not found');
      }

      if (status === 'completed') {
        // Submit with all data
        const response = await doctorService.submitConsultation(
          consultation.id,
          {
            // Medical record data
            diagnosis,
            diagnosis_image_url: diagnosisImage,
            treatment_plan: treatmentPlan,
            medical_notes: medicalNotes,
            
            // Prescription data
            prescription_text: prescription,
            prescription_image_url: prescriptionImage,
            duration_days: durationDays ? parseInt(durationDays) : undefined,
            prescription_notes: prescriptionNotes,
            
            // Status
            complete_consultation: true,
          },
          token
        );

        if (!response.success) {
          throw new Error(response.error || 'Failed to submit consultation');
        }

        Alert.alert(
          'Success',
          'Consultation completed successfully',
          [
            { text: 'OK', onPress: () => router.push('/(tabs)') }
          ]
        );
      } else {
        // Mark as missed
        const response = await doctorService.markConsultationAsMissed(
          consultation.id,
          token
        );

        if (!response.success) {
          throw new Error(response.error || 'Failed to mark consultation as missed');
        }

        Alert.alert(
          'Consultation Marked as Missed',
          'The appointment has been marked as missed',
          [
            { text: 'OK', onPress: () => router.push('/(tabs)') }
          ]
        );
      }
    } catch (err: any) {
      console.error('Error submitting consultation:', err);
      Alert.alert('Error', err.message || 'Failed to submit consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPatientInfo = () => {
    if (!appointment) return null;

    const patientName = appointment.patient ? 
      `${appointment.patient.name}` : 
      'Unknown Patient';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Patient:</Text>
          <Text style={styles.infoValue}>{patientName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Appointment Date:</Text>
          <Text style={styles.infoValue}>{appointment.appointment_date}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Appointment Time:</Text>
          <Text style={styles.infoValue}>{appointment.appointment_time}</Text>
        </View>
        
        {appointment.appointment_type && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{appointment.appointment_type}</Text>
          </View>
        )}

        {appointment.notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notes:</Text>
            <Text style={styles.infoValue}>{appointment.notes}</Text>
          </View>
        )}

        {/* Symptom Analysis Section */}
        {appointment.symptoms && (
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Symptom Analysis</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Symptoms:</Text>
              <Text style={styles.infoValue}>{appointment.symptoms}</Text>
            </View>
            
            {appointment.criticality && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Criticality:</Text>
                <Text style={[
                  styles.infoValue, 
                  styles.criticality,
                  appointment.criticality === 'High' || appointment.criticality === 'Emergency' ? styles.criticalityHigh : 
                  appointment.criticality === 'Medium' ? styles.criticalityMedium : 
                  styles.criticalityLow
                ]}>
                  {appointment.criticality}
                </Text>
              </View>
            )}
            
            {appointment.possible_illness_1 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Possible Diagnosis 1:</Text>
                <Text style={styles.infoValue}>{appointment.possible_illness_1}</Text>
              </View>
            )}
            
            {appointment.possible_illness_2 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Possible Diagnosis 2:</Text>
                <Text style={styles.infoValue}>{appointment.possible_illness_2}</Text>
              </View>
            )}
            
            {(appointment.recommended_doctor_speciality_1 || appointment.recommended_doctor_speciality_2) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recommended Specialists:</Text>
                <Text style={styles.infoValue}>
                  {[
                    appointment.recommended_doctor_speciality_1,
                    appointment.recommended_doctor_speciality_2
                  ].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderMedicalDiagnosis = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Diagnosis</Text>
        
        <Text style={styles.inputLabel}>Diagnosis*</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          placeholder="Enter your medical diagnosis"
          value={diagnosis}
          onChangeText={setDiagnosis}
        />
        
        <Text style={styles.inputLabel}>Upload Diagnosis Image (Optional)</Text>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => pickImage(setDiagnosisImage, true)}
          disabled={uploadingDiagnosisImage}
        >
          {uploadingDiagnosisImage ? (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ActivityIndicator size="small" color="#0466C8" />
              <Text style={styles.uploadText}>Uploading...</Text>
            </View>
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="cloud-upload" size={24} color="#0466C8" />
              <Text style={styles.uploadText}>
                {diagnosisImage ? 'Change Image' : 'Upload Image'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {diagnosisImage && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ 
                uri: diagnosisImage.startsWith('http') 
                  ? diagnosisImage 
                  : `${doctorService.BASE_URL}${diagnosisImage}`
              }} 
              style={styles.previewImage} 
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setDiagnosisImage(undefined)}
            >
              <Ionicons name="close-circle" size={24} color="#E71D36" />
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={styles.inputLabel}>Treatment Plan (Optional)</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={3}
          placeholder="Enter recommended treatment plan"
          value={treatmentPlan}
          onChangeText={setTreatmentPlan}
        />
        
        <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={3}
          placeholder="Enter any additional notes"
          value={medicalNotes}
          onChangeText={setMedicalNotes}
        />
      </View>
    );
  };

  const renderPrescription = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Prescription</Text>
        
        <Text style={styles.inputLabel}>Prescription*</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={5}
          placeholder="Enter the prescription details"
          value={prescription}
          onChangeText={setPrescription}
        />
        
        <Text style={styles.inputLabel}>Upload Prescription Image (Optional)</Text>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => pickImage(setPrescriptionImage, false)}
          disabled={uploadingPrescriptionImage}
        >
          {uploadingPrescriptionImage ? (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ActivityIndicator size="small" color="#0466C8" />
              <Text style={styles.uploadText}>Uploading...</Text>
            </View>
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="cloud-upload" size={24} color="#0466C8" />
              <Text style={styles.uploadText}>
                {prescriptionImage ? 'Change Image' : 'Upload Image'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {prescriptionImage && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ 
                uri: prescriptionImage.startsWith('http') 
                  ? prescriptionImage 
                  : `${doctorService.BASE_URL}${prescriptionImage}`
              }} 
              style={styles.previewImage} 
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setPrescriptionImage(undefined)}
            >
              <Ionicons name="close-circle" size={24} color="#E71D36" />
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={styles.inputLabel}>Duration (Days)</Text>
        <TextInput
          style={[styles.textInput, { width: '30%' }]}
          placeholder="Number of days"
          value={durationDays}
          onChangeText={text => setDurationDays(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
        />
        
        <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={3}
          placeholder="Enter any additional notes for the prescription"
          value={prescriptionNotes}
          onChangeText={setPrescriptionNotes}
        />
      </View>
    );
  };

  const renderCompletion = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confirm and Complete</Text>
        
        <View style={styles.summaryBox}>
          <Text style={styles.summaryHeading}>Consultation Summary</Text>
          
          {diagnosis && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Diagnosis:</Text>
              <Text style={styles.summaryValue}>{diagnosis}</Text>
            </View>
          )}
          
          {diagnosisImage && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Diagnosis Image:</Text>
              <Text style={styles.summaryValue}>Provided</Text>
            </View>
          )}
          
          {prescription && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Prescription:</Text>
              <Text style={styles.summaryValue}>{prescription}</Text>
            </View>
          )}
          
          {prescriptionImage && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Prescription Image:</Text>
              <Text style={styles.summaryValue}>Provided</Text>
            </View>
          )}
          
          {durationDays && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{durationDays} days</Text>
            </View>
          )}
          
          <Text style={styles.summaryNotice}>
            Please review the information above before completing the consultation.
          </Text>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case ConsultationStep.LOADING:
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0466C8" />
            <Text style={styles.loadingText}>Loading consultation...</Text>
          </View>
        );
      case ConsultationStep.PATIENT_INFO:
        return renderPatientInfo();
      case ConsultationStep.MEDICAL_DIAGNOSIS:
        return renderMedicalDiagnosis();
      case ConsultationStep.PRESCRIPTION:
        return renderPrescription();
      case ConsultationStep.COMPLETION:
        return renderCompletion();
      default:
        return null;
    }
  };
  const renderNavButtons = () => {
    if (currentStep === ConsultationStep.LOADING) return null;
    
    return (
      <View style={styles.navButtonContainer}>
        {/* Show Back button for all pages except Patient Info */}
        {currentStep !== ConsultationStep.PATIENT_INFO && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePreviousStep}
            disabled={submitting}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Show Mark as Missed button on the Patient Info page */}
        {currentStep === ConsultationStep.PATIENT_INFO && (
          <TouchableOpacity
            style={[styles.button, styles.missedButton]}
            onPress={() => handleSubmitConsultation('missed')}
            disabled={submitting}
          >
            <Text style={styles.missedButtonText}>Mark as Missed</Text>
          </TouchableOpacity>
        )}        {currentStep !== ConsultationStep.COMPLETION ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNextStep}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => handleSubmitConsultation('completed')}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Complete</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Consultation',
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadAppointmentAndStartConsultation}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Progress Indicator */}
            {!loading && (
              <View style={styles.progressContainer}>
                {['Patient Info', 'Diagnosis', 'Prescription', 'Complete'].map((step, index) => (
                  <View key={index} style={styles.progressStep}>
                    <View 
                      style={[
                        styles.progressDot,
                        currentStep > ConsultationStep.LOADING && index <= currentStep - 1 ? 
                          styles.progressDotActive : 
                          styles.progressDotInactive
                      ]}
                    />
                    <Text 
                      style={[
                        styles.progressText,
                        currentStep > ConsultationStep.LOADING && index <= currentStep - 1 ? 
                          styles.progressTextActive : 
                          styles.progressTextInactive
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
                
                <View style={styles.progressLine} />
              </View>
            )}

            {/* Current Step Content */}
            {renderCurrentStep()}

            {/* Navigation Buttons */}
            {renderNavButtons()}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E71D36',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0466C8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
    position: 'relative',
  },
  progressStep: {
    alignItems: 'center',
    width: '25%', // For 4 steps
    zIndex: 1,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#0466C8',
  },
  progressDotInactive: {
    backgroundColor: '#C4C4C4',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressTextActive: {
    color: '#0466C8',
    fontWeight: '600',
  },
  progressTextInactive: {
    color: '#888',
  },
  progressLine: {
    position: 'absolute',
    top: 12, // Half of dot height
    left: '12.5%', // Half of first dot offset
    right: '12.5%', // Half of last dot offset
    height: 2,
    backgroundColor: '#C4C4C4',
    zIndex: 0,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: '600',
    width: '40%',
    color: '#555',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  analysisSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  criticality: {
    fontWeight: '600',
  },
  criticalityHigh: {
    color: '#E71D36',
  },
  criticalityMedium: {
    color: '#FF9F1C',
  },
  criticalityLow: {
    color: '#2EC4B6',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E5EB',
    fontSize: 16,
    color: '#333',
    width: '100%',
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0466C8',
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    justifyContent: 'center',
  },
  uploadText: {
    marginLeft: 10,
    color: '#0466C8',
    fontWeight: '500',
    fontSize: 16,
  },
  imageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 5,
  },
  navButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0466C8',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  missedButton: {
    backgroundColor: '#FBE9EA',
    borderWidth: 1,
    borderColor: '#E71D36',
  },
  missedButtonText: {
    color: '#E71D36',
    fontSize: 16,
    fontWeight: '600',
  },
  completionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  summaryBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5EB',
  },
  summaryHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  summaryLabel: {
    fontWeight: '600',
    width: '35%',
    color: '#555',
  },
  summaryValue: {
    flex: 1,
    color: '#333',
  },
  summaryNotice: {
    marginTop: 16,
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
  },
});