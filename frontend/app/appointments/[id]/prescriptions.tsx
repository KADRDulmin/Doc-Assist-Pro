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
import appointmentService, { PrescriptionData } from '@/src/services/appointment.service';
import prescriptionService from '@/src/services/prescription.service';

export default function PrescriptionsScreen() {
  const params = useLocalSearchParams();
  const appointmentId = typeof params.id === 'string' ? parseInt(params.id) : 0;
  
  const colorScheme = useColorScheme();
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      loadPrescriptions();
    } else {
      setError('Invalid appointment ID');
      setLoading(false);
    }
  }, [appointmentId]);

  const loadPrescriptions = async () => {
    try {
      // Get the appointment details first to verify it exists
      const appointmentResponse = await appointmentService.getAppointmentById(appointmentId);
      
      if (!appointmentResponse.success) {
        setError(appointmentResponse.message || 'Failed to load appointment details');
        setLoading(false);
        return;
      }
      
      // Use our new prescription service to get prescriptions by appointment ID
      const prescriptionsResponse = await prescriptionService.getPrescriptionsByAppointment(appointmentId);
      
      if (prescriptionsResponse.success) {
        setPrescriptions(prescriptionsResponse.data);
      } else {
        setError(prescriptionsResponse.message || 'Failed to load prescriptions');
      }
    } catch (err: any) {
      console.error('Error loading prescriptions:', err);
      setError(err?.message || 'An error occurred while loading prescriptions');
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

  // Get a badge color based on prescription status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50'; // Green
      case 'completed':
        return '#2196F3'; // Blue
      case 'cancelled':
        return '#FF5252'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading prescriptions...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadPrescriptions}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Prescriptions',
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
          },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.title}>Prescriptions</ThemedText>

        {prescriptions.length === 0 ? (
          <ThemedView style={styles.emptyCard}>
            <Ionicons 
              name="medical-outline" 
              size={60} 
              color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              style={{ opacity: 0.5 }} 
            />
            <ThemedText style={styles.emptyText}>
              No prescriptions found for this appointment
            </ThemedText>
          </ThemedView>
        ) : (
          prescriptions.map((prescription) => (
            <ThemedView key={prescription.id} style={styles.prescriptionCard}>
              <View style={styles.prescriptionHeader}>
                <ThemedText style={styles.prescriptionDate}>
                  {formatDate(prescription.prescription_date)}
                </ThemedText>
                <View 
                  style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(prescription.status) }
                  ]}
                >
                  <ThemedText style={styles.statusText}>
                    {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.doctorInfo}>
                <Ionicons 
                  name="person" 
                  size={16} 
                  color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                />
                <ThemedText style={styles.doctorName}>
                  Dr. {prescription.doctor?.user?.first_name} {prescription.doctor?.user?.last_name}
                </ThemedText>
              </View>

              {prescription.prescription_text && (
                <View style={styles.prescriptionSection}>
                  <ThemedText style={styles.sectionTitle}>Prescription</ThemedText>
                  <ThemedText style={styles.sectionContent}>
                    {prescription.prescription_text}
                  </ThemedText>
                </View>
              )}

              {prescription.duration_days && (
                <View style={styles.durationSection}>
                  <Ionicons 
                    name="time-outline" 
                    size={16} 
                    color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                  />
                  <ThemedText style={styles.durationText}>
                    Duration: {prescription.duration_days} days
                  </ThemedText>
                </View>
              )}

              {prescription.notes && (
                <View style={styles.prescriptionSection}>
                  <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
                  <ThemedText style={styles.sectionContent}>{prescription.notes}</ThemedText>
                </View>
              )}

              {/* If there is a prescription image, show it */}
              {prescription.prescription_image_url && (
                <TouchableOpacity 
                  style={styles.viewImageButton}
                  onPress={() => router.push(`/appointments/${appointmentId}/image?url=${encodeURIComponent(prescription.prescription_image_url || '')}&title=Prescription Image`)}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <ThemedText style={styles.viewImageText}>View Prescription Image</ThemedText>
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
  prescriptionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  prescriptionDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 14,
    marginLeft: 6,
  },
  prescriptionSection: {
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
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationText: {
    fontSize: 14,
    marginLeft: 6,
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