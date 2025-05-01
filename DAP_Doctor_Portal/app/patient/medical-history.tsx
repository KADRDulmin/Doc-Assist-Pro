import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, Dimensions, Linking } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Divider, Chip, FAB } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import doctorService, { MedicalRecordData, PatientData, PrescriptionData } from '../../services/doctorService';
import Colors from '../../constants/Colors';

export default function MedicalHistoryScreen() {
  const { patientId, patientName } = useLocalSearchParams<{ patientId: string, patientName: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordData[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordData | null>(null);

  // Helper function to convert relative image paths to absolute URLs
  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    
    // If it's already a full URL (starts with http:// or https://) or a base64 image, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:image')) {
      return imagePath;
    }
    
    // Add server base URL to the relative path
    // Make sure the path starts with a slash
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${doctorService.BASE_URL}${path}`;
  };

  // Helper function to find prescriptions related to a medical record
  const getRelatedPrescriptions = (record: MedicalRecordData) => {
    // Match prescriptions with the same consultation_id as the medical record
    return prescriptions.filter(
      prescription => prescription.consultation_id === record.consultation_id
    );
  };

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!patientId) {
        setError('Patient ID is required');
        return;
      }
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      // Fetch medical records and prescriptions in parallel
      const [recordsResponse, prescriptionsResponse] = await Promise.all([
        doctorService.getPatientMedicalRecords(parseInt(patientId), token),
        doctorService.getPatientPrescriptions(parseInt(patientId), token)
      ]);
      
      if (recordsResponse.success && recordsResponse.data) {
        console.log(`Loaded ${recordsResponse.data.length} medical records successfully`);
        setMedicalRecords(recordsResponse.data);
      } else {
        console.error('Failed to load medical records:', recordsResponse.error);
        setError(recordsResponse.error || 'Failed to load medical records');
      }
      
      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        console.log(`Loaded ${prescriptionsResponse.data.length} prescriptions successfully`);
        setPrescriptions(prescriptionsResponse.data);
      } else {
        console.error('Failed to load prescriptions:', prescriptionsResponse.error);
        // Don't set error for this, as we can still show medical records without prescriptions
      }
      
    } catch (err: any) {
      console.error('Error loading medical history:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMedicalHistory();
  }, [patientId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMedicalHistory();
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const openImage = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('Error opening URL:', err);
      setError('Could not open image');
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading medical history...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: patientName ? `${patientName}'s Medical History` : 'Medical History',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <View style={styles.container}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={loadMedicalHistory} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        )}
        
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {medicalRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="notes-medical" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No medical records found</Text>
              <Text style={styles.emptySubText}>
                Medical records will appear here after consultations
              </Text>
            </View>
          ) : (
            medicalRecords.map((record) => (
              <Card key={record.id} style={styles.recordCard}>
                <Card.Content>
                  <View style={styles.recordHeader}>
                    <View>
                      <Text style={styles.recordDate}>
                        {formatDate(record.record_date)}
                      </Text>
                      <Text style={styles.doctorName}>
                        {record.doctor?.user?.first_name && record.doctor?.user?.last_name ? 
                          `Dr. ${record.doctor.user.first_name} ${record.doctor.user.last_name}` : 
                          'Doctor'
                        }
                      </Text>
                    </View>
                    <Chip icon="stethoscope" style={styles.specialtyChip}>
                      {record.doctor?.specialization || 'Specialist'}
                    </Chip>
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.recordBody}>
                    <Text style={styles.sectionTitle}>Diagnosis</Text>
                    <Text style={styles.diagnosisText}>{record.diagnosis}</Text>
                    
                    {record.diagnosis_image_url && (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: getFullImageUrl(record.diagnosis_image_url) }} 
                          style={styles.diagnosisImage}
                          resizeMode="contain"
                        />
                        <Button 
                          mode="text" 
                          onPress={() => openImage(getFullImageUrl(record.diagnosis_image_url)!)}
                          style={styles.viewImageButton}
                        >
                          View Full Image
                        </Button>
                      </View>
                    )}
                    
                    {record.treatment_plan && (
                      <>
                        <Text style={styles.sectionTitle}>Treatment Plan</Text>
                        <Text style={styles.treatmentText}>{record.treatment_plan}</Text>
                      </>
                    )}
                    
                    {record.notes && (
                      <>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.notesText}>{record.notes}</Text>
                      </>
                    )}

                    {/* Display prescriptions related to this record */}
                    {getRelatedPrescriptions(record).length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>
                          <FontAwesome5 name="prescription-bottle-alt" size={14} color={Colors.light.primary} style={{marginRight: 8}} />
                          Prescriptions
                        </Text>
                        {getRelatedPrescriptions(record).map((prescription) => (
                          <View key={prescription.id} style={styles.prescriptionContainer}>
                            <View style={styles.prescriptionHeader}>
                              <Text style={styles.prescriptionDate}>
                                Prescribed: {formatDate(prescription.prescription_date)}
                              </Text>
                              <Chip 
                                icon="pill" 
                                style={[
                                  styles.statusChip,
                                  prescription.status === 'active' ? styles.activeChip :
                                  prescription.status === 'completed' ? styles.completedChip :
                                  styles.cancelledChip
                                ]}
                                textStyle={styles.chipText}
                              >
                                {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                              </Chip>
                            </View>
                            
                            <Text style={styles.prescriptionText}>
                              {prescription.prescription_text}
                            </Text>
                            
                            {prescription.duration_days && (
                              <Text style={styles.durationText}>
                                Duration: {prescription.duration_days} {prescription.duration_days === 1 ? 'day' : 'days'}
                              </Text>
                            )}
                            
                            {prescription.notes && (
                              <Text style={styles.prescriptionNotes}>
                                Notes: {prescription.notes}
                              </Text>
                            )}
                            
                            {prescription.prescription_image_url && (
                              <View style={styles.imageContainer}>
                                <Image 
                                  source={{ uri: getFullImageUrl(prescription.prescription_image_url) }} 
                                  style={styles.prescriptionImage}
                                  resizeMode="contain"
                                />
                                <Button 
                                  mode="text" 
                                  onPress={() => openImage(getFullImageUrl(prescription.prescription_image_url)!)}
                                  style={styles.viewImageButton}
                                >
                                  View Prescription Image
                                </Button>
                              </View>
                            )}
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
        
        <FAB
          style={styles.fab}
          icon="arrow-left"
          label="Back"
          onPress={() => router.back()}
        />
      </View>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    width: 150,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  recordCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  doctorName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  specialtyChip: {
    backgroundColor: Colors.light.tint,
    height: 30,
  },
  divider: {
    marginVertical: 12,
  },
  recordBody: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 12,
    color: Colors.light.primary,
  },
  diagnosisText: {
    fontSize: 15,
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  diagnosisImage: {
    width: width - 64,
    height: 200,
    borderRadius: 8,
  },
  viewImageButton: {
    marginTop: 4,
  },
  treatmentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: 0,
    backgroundColor: Colors.light.primary,
  },
  prescriptionContainer: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  activeChip: {
    backgroundColor: '#4CAF50',
  },
  completedChip: {
    backgroundColor: '#2196F3',
  },
  cancelledChip: {
    backgroundColor: '#F44336',
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  prescriptionText: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  prescriptionNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
  },
  prescriptionImage: {
    width: width - 64,
    height: 200,
    borderRadius: 8,
  },
});