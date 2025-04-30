import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import appointmentService, { MedicalRecordData } from '@/src/services/appointment.service';
import medicalRecordService from '@/src/services/medical-record.service';

export default function MedicalRecordsScreen() {
  const params = useLocalSearchParams();
  const appointmentId = typeof params.id === 'string' ? parseInt(params.id) : 0;
  
  const colorScheme = useColorScheme();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      loadMedicalRecords();
    } else {
      setError('Invalid appointment ID');
      setLoading(false);
    }
  }, [appointmentId]);

  const loadMedicalRecords = async () => {
    try {
      // Get the appointment details first to verify it exists
      const appointmentResponse = await appointmentService.getAppointmentById(appointmentId);
      
      if (!appointmentResponse.success) {
        setError(appointmentResponse.message || 'Failed to load appointment details');
        setLoading(false);
        return;
      }
      
      // Use our new medical record service to get medical records by appointment ID
      const medicalRecordsResponse = await medicalRecordService.getMedicalRecordsByAppointment(appointmentId);
      
      if (medicalRecordsResponse.success) {
        setMedicalRecords(medicalRecordsResponse.data);
      } else {
        setError(medicalRecordsResponse.message || 'Failed to load medical records');
      }
    } catch (err: any) {
      console.error('Error loading medical records:', err);
      setError(err?.message || 'An error occurred while loading medical records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading medical records...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadMedicalRecords}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Medical Records',
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
          },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.title}>Medical Records</ThemedText>

        {medicalRecords.length === 0 ? (
          <ThemedView style={styles.emptyCard}>
            <Ionicons 
              name="document-text-outline" 
              size={60} 
              color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              style={{ opacity: 0.5 }} 
            />
            <ThemedText style={styles.emptyText}>
              No medical records found for this appointment
            </ThemedText>
          </ThemedView>
        ) : (
          medicalRecords.map((record) => (
            <ThemedView key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <ThemedText style={styles.recordDate}>
                  {formatDate(record.record_date)}
                </ThemedText>
                <View style={styles.doctorInfo}>
                  <Ionicons 
                    name="person" 
                    size={16} 
                    color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                  />
                  <ThemedText style={styles.doctorName}>
                    Dr. {record.doctor?.user?.first_name} {record.doctor?.user?.last_name}
                  </ThemedText>
                </View>
              </View>

              {record.diagnosis && (
                <View style={styles.recordSection}>
                  <ThemedText style={styles.sectionTitle}>Diagnosis</ThemedText>
                  <ThemedText style={styles.sectionContent}>
                    {record.diagnosis}
                  </ThemedText>
                </View>
              )}

              {record.treatment_plan && (
                <View style={styles.recordSection}>
                  <ThemedText style={styles.sectionTitle}>Treatment Plan</ThemedText>
                  <ThemedText style={styles.sectionContent}>
                    {record.treatment_plan}
                  </ThemedText>
                </View>
              )}

              {record.notes && (
                <View style={styles.recordSection}>
                  <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
                  <ThemedText style={styles.sectionContent}>{record.notes}</ThemedText>
                </View>
              )}

              {/* If there is a diagnosis image, show it */}
              {record.diagnosis_image_url && (
                <TouchableOpacity 
                  style={styles.viewImageButton}
                  onPress={() => router.push(`/appointments/${appointmentId}/image?url=${encodeURIComponent(record.diagnosis_image_url || '')}&title=Diagnosis Image`)}
                >
                  <Ionicons name="image" size={20} color="#fff" />
                  <ThemedText style={styles.viewImageText}>View Diagnosis Image</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  recordCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  recordHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 14,
    marginLeft: 6,
  },
  recordSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  viewImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  viewImageText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
});