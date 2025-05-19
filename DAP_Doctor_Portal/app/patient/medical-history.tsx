import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Dimensions, 
  RefreshControl, 
  Modal,
  Share
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '../../hooks/useColorScheme';
import Colors from '../../constants/Colors';
import ModernHeader from '../../components/ui/ModernHeader';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { authService } from '../../services/authService';
import doctorService, { MedicalRecordData, PrescriptionData } from '../../services/doctorService';
import { formatDate } from '../../utils/dateUtils';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { getFullImageUrl } from '../../utils/imageUtils';

// Define a combined type to handle both medical records and prescriptions
type MedicalHistoryItem = {
  id: number;
  type: 'medical-record' | 'prescription';
  date: string;
  data: MedicalRecordData | PrescriptionData;
  doctor?: {
    name?: string;
    specialization?: string;
  };
}

export default function MedicalHistoryScreen() {  const params = useLocalSearchParams();
  const patientId = typeof params.patientId === 'string' ? parseInt(params.patientId) : 0;
  const patientName = typeof params.patientName === 'string' ? params.patientName : 'Patient';
  const colorScheme = useColorScheme();
  const theme = (colorScheme ?? 'light') as 'light' | 'dark';

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<MedicalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState<string>('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (patientId) {
      loadPatientHistory();
    } else {
      setError('Invalid patient ID');
      setLoading(false);
    }
  }, [patientId]);

  const loadPatientHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // First, get all consultations for this patient through completed appointments
      const appointmentsResponse = await doctorService.getAppointments(
        token, 
        undefined, 
        'completed'
      );      if (!appointmentsResponse.success || !appointmentsResponse.data) {
        throw new Error(appointmentsResponse.error ?? 'Failed to load appointments');
      }// Filter appointments for this specific patient
      const patientAppointments = appointmentsResponse.data.filter(
        app => app.patient_id === patientId
      );

      // Get consultations for each appointment
      const consultationsPromises = patientAppointments.map(appointment => 
        doctorService.getConsultationByAppointment(appointment.id, token)
      );
        const consultationResponses = await Promise.all(consultationsPromises);
      const validConsultations = consultationResponses
        .filter(res => res.success && res.data)
        .map(res => res.data!);
      
      // Now get medical records and prescriptions for each consultation
      const historyItems: MedicalHistoryItem[] = [];

      for (const consultation of validConsultations) {
        // Get medical records
        const medicalRecordsResponse = await doctorService.getConsultationMedicalRecords(
          consultation.id, 
          token
        );
        
        if (medicalRecordsResponse.success && medicalRecordsResponse.data) {
          medicalRecordsResponse.data.forEach(record => {
            historyItems.push({
              id: record.id,
              type: 'medical-record',
              date: record.record_date,              data: record,
              doctor: {
                name: `${consultation.doctor?.user?.first_name ?? ''} ${consultation.doctor?.user?.last_name ?? ''}`.trim(),
                specialization: consultation.doctor?.specialization,
              }
            });
          });
        }
        
        // Get prescriptions
        const prescriptionsResponse = await doctorService.getConsultationPrescriptions(
          consultation.id, 
          token
        );
        
        if (prescriptionsResponse.success && prescriptionsResponse.data) {
          prescriptionsResponse.data.forEach(prescription => {
            historyItems.push({
              id: prescription.id,
              type: 'prescription',
              date: prescription.prescription_date,              data: prescription,
              doctor: {
                name: `${consultation.doctor?.user?.first_name ?? ''} ${consultation.doctor?.user?.last_name ?? ''}`.trim(),
                specialization: consultation.doctor?.specialization,
              }
            });
          });
        }
      }
      
      // Sort by date (newest first)
      historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setMedicalHistory(historyItems);
      setFilteredHistory(historyItems);    } catch (err: any) {
      console.error('Error loading patient history:', err);
      setError(err.message ?? 'Failed to load patient medical history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    setPage(1);
    loadPatientHistory();
  };
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
    
    if (!query.trim()) {
      setFilteredHistory(medicalHistory);
      return;
    }
    
    const searchTerms = query.toLowerCase().trim().split(' ');
      const filtered = medicalHistory.filter(item => {
      // For medical records, search diagnosis and treatment_plan
      if (item.type === 'medical-record') {
        const record = item.data as MedicalRecordData;
        const diagnosisText = record.diagnosis?.toLowerCase() ?? '';
        const treatmentText = record.treatment_plan?.toLowerCase() ?? '';
        const notesText = record.notes?.toLowerCase() ?? '';
        const doctorName = item.doctor?.name?.toLowerCase() ?? '';
        const specialization = item.doctor?.specialization?.toLowerCase() ?? '';
        
        return searchTerms.some(term => 
          diagnosisText.includes(term) || 
          treatmentText.includes(term) || 
          notesText.includes(term) ||
          doctorName.includes(term) ||
          specialization.includes(term)
        );
      } 
      // For prescriptions, search prescription_text and notes
      else if (item.type === 'prescription') {
        const prescription = item.data as PrescriptionData;
        const prescriptionText = prescription.prescription_text?.toLowerCase() ?? '';
        const notesText = prescription.notes?.toLowerCase() ?? '';
        const doctorName = item.doctor?.name?.toLowerCase() ?? '';
        const specialization = item.doctor?.specialization?.toLowerCase() ?? '';
        
        return searchTerms.some(term => 
          prescriptionText.includes(term) || 
          notesText.includes(term) ||
          doctorName.includes(term) ||
          specialization.includes(term)
        );
      }
      
      return false;
    });
    
    setFilteredHistory(filtered);
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };  const openImageViewer = (imageUrl: string | undefined, title: string = 'Medical Image') => {
    if (!imageUrl) return;
    const fullImageUrl = getFullImageUrl(imageUrl);
    setSelectedImage(fullImageUrl);
    setImageTitle(title);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    setImageViewerVisible(false);
  };
    const handleShareImage = async () => {
    if (!selectedImage) return;
    
    try {
      await Share.share({
        url: selectedImage,
        title: imageTitle,
        message: `${imageTitle} from patient ${patientName}'s medical history`
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  const loadMoreItems = () => {
    if (filteredHistory.length === 0 || !hasMore) return;
    
    // Only increment page if there are more items to show
    if (page * ITEMS_PER_PAGE < filteredHistory.length) {
      setPage(prevPage => prevPage + 1);
    } else {
      setHasMore(false);
    }
  };
  
  // Get the current page of items
  const paginatedItems = useMemo(() => {
    return filteredHistory.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredHistory, page, ITEMS_PER_PAGE]);

  const renderMedicalRecordItem = (item: MedicalHistoryItem) => {
    const record = item.data as MedicalRecordData;
    const itemId = `medical-${record.id}`;
    const isExpanded = expandedItems.has(itemId);
    
    return (
      <ThemedView 
        variant="card" 
        useShadow 
        style={styles.historyItem}
        key={itemId}
      >
        <TouchableOpacity 
          style={styles.itemHeader}
          onPress={() => toggleItemExpand(itemId)}
        >
          <View style={styles.itemTypeContainer}>
            <View style={[styles.itemTypeIndicator, { backgroundColor: Colors[theme].primary }]}>
              <FontAwesome5 name="notes-medical" size={16} color="#FFF" />
            </View>
            <View style={styles.itemHeaderTextContainer}>
              <ThemedText type="subheading" style={styles.itemTitle}>
                Medical Diagnosis
              </ThemedText>
              <ThemedText variant="secondary" style={styles.itemDate}>
                {formatDate(record.record_date)}
              </ThemedText>
            </View>
          </View>
          <FontAwesome 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={Colors[theme].textSecondary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.itemContent}>
            {item.doctor?.name && (
              <View style={styles.doctorInfo}>
                <FontAwesome5 name="user-md" size={14} color={Colors[theme].primary} />
                <ThemedText style={styles.doctorText}>
                  Dr. {item.doctor.name} {item.doctor.specialization && `(${item.doctor.specialization})`}
                </ThemedText>
              </View>
            )}
            
            <View style={styles.sectionContainer}>
              <ThemedText type="default" style={styles.sectionTitle}>Diagnosis:</ThemedText>
              <ThemedText style={styles.sectionContent}>{record.diagnosis}</ThemedText>
            </View>
              {record.diagnosis_image_url && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: getFullImageUrl(record.diagnosis_image_url) }} 
                  style={styles.image}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.viewFullImageButton}
                  onPress={() => openImageViewer(record.diagnosis_image_url, 'Medical Diagnosis Image')}
                >
                  <ThemedText style={styles.viewFullImageText}>View Full Image</ThemedText>
                </TouchableOpacity>
              </View>
            )}
            
            {record.treatment_plan && (
              <View style={styles.sectionContainer}>
                <ThemedText type="default" style={styles.sectionTitle}>Treatment Plan:</ThemedText>
                <ThemedText style={styles.sectionContent}>{record.treatment_plan}</ThemedText>
              </View>
            )}
            
            {record.notes && (
              <View style={styles.sectionContainer}>
                <ThemedText type="default" style={styles.sectionTitle}>Notes:</ThemedText>
                <ThemedText variant="secondary" style={styles.sectionContent}>{record.notes}</ThemedText>
              </View>
            )}
          </View>
        )}
      </ThemedView>
    );
  };

  const renderPrescriptionItem = (item: MedicalHistoryItem) => {
    const prescription = item.data as PrescriptionData;
    const itemId = `prescription-${prescription.id}`;
    const isExpanded = expandedItems.has(itemId);
    
    return (
      <ThemedView 
        variant="card" 
        useShadow 
        style={styles.historyItem}
        key={itemId}
      >
        <TouchableOpacity 
          style={styles.itemHeader}
          onPress={() => toggleItemExpand(itemId)}
        >
          <View style={styles.itemTypeContainer}>
            <View style={[styles.itemTypeIndicator, { backgroundColor: Colors[theme].success }]}>
              <FontAwesome5 name="prescription" size={16} color="#FFF" />
            </View>
            <View style={styles.itemHeaderTextContainer}>
              <ThemedText type="subheading" style={styles.itemTitle}>
                Prescription
              </ThemedText>
              <ThemedText variant="secondary" style={styles.itemDate}>
                {formatDate(prescription.prescription_date)}
              </ThemedText>
            </View>
          </View>
          <FontAwesome 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={Colors[theme].textSecondary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.itemContent}>
            {item.doctor?.name && (
              <View style={styles.doctorInfo}>
                <FontAwesome5 name="user-md" size={14} color={Colors[theme].primary} />
                <ThemedText style={styles.doctorText}>
                  Dr. {item.doctor.name} {item.doctor.specialization && `(${item.doctor.specialization})`}
                </ThemedText>
              </View>
            )}
            
            <View style={styles.statusContainer}>
              <ThemedText type="default">Status:</ThemedText>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(prescription.status, theme) }
              ]}>
                <ThemedText style={styles.statusText}>
                  {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.sectionContainer}>
              <ThemedText type="default" style={styles.sectionTitle}>Prescription:</ThemedText>
              <ThemedText style={styles.sectionContent}>{prescription.prescription_text}</ThemedText>
            </View>
            
            {prescription.duration_days && (
              <View style={styles.durationContainer}>
                <MaterialCommunityIcons name="calendar-clock" size={14} color={Colors[theme].primary} />
                <ThemedText style={styles.durationText}>
                  Duration: {prescription.duration_days} {prescription.duration_days === 1 ? 'day' : 'days'}
                </ThemedText>
              </View>
            )}
              {prescription.prescription_image_url && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: getFullImageUrl(prescription.prescription_image_url) }} 
                  style={styles.image}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.viewFullImageButton}
                  onPress={() => openImageViewer(prescription.prescription_image_url, 'Prescription Image')}
                >
                  <ThemedText style={styles.viewFullImageText}>View Full Image</ThemedText>
                </TouchableOpacity>
              </View>
            )}
            
            {prescription.notes && (
              <View style={styles.sectionContainer}>
                <ThemedText type="default" style={styles.sectionTitle}>Notes:</ThemedText>
                <ThemedText variant="secondary" style={styles.sectionContent}>{prescription.notes}</ThemedText>
              </View>
            )}
          </View>
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView variant="secondary" style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
        <ModernHeader 
        title={`${patientName}'s Medical History`}
        showBackButton
      />
      
      <Searchbar
        placeholder="Search medical history"
        onChangeText={handleSearch}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: Colors[theme].card }]}
        iconColor={Colors[theme].icon}
        inputStyle={{ color: Colors[theme].text }}
        placeholderTextColor={Colors[theme].textTertiary}
      />
      
      {error ? (
        <ThemedView variant="card" useShadow style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={50} color={Colors[theme].danger} />
          <ThemedText type="error" style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors[theme].primary }]}
            onPress={loadPatientHistory}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : loading && !refreshing ? (
        <ThemedView variant="card" useShadow style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[theme].primary} />
          <ThemedText variant="secondary" style={styles.loadingText}>
            Loading medical history...
          </ThemedText>
        </ThemedView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {paginatedItems.length === 0 ? (
            <ThemedView variant="card" useShadow style={styles.emptyContainer}>
              <FontAwesome5 
                name="file-medical-alt" 
                size={50} 
                color={Colors[theme].textTertiary} 
              />
              <ThemedText variant="secondary" style={styles.emptyText}>
                {searchQuery 
                  ? 'No medical history matches your search' 
                  : 'No medical history found for this patient'
                }
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedText variant="secondary" style={styles.resultCount}>
                {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'} found
              </ThemedText>
              
              {paginatedItems.map(item => 
                item.type === 'medical-record' 
                  ? renderMedicalRecordItem(item) 
                  : renderPrescriptionItem(item)
              )}
              
              {/* Load more button */}
              {hasMore && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={loadMoreItems}
                >
                  <ThemedText style={styles.loadMoreText}>
                    {loading ? 'Loading more...' : 'Load More'}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackground} onPress={closeImageViewer} />
          <View style={styles.modalContent}>            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
            
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShareImage}>
                <Ionicons name="share-outline" size={24} color="#FFF" />
                <ThemedText style={styles.actionText}>Share</ThemedText>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  searchbar: {
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  historyItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTypeIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemHeaderTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
  },
  itemContent: {
    padding: 16,
    paddingTop: 0,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  doctorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  imageContainer: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  viewFullImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewFullImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loadingContainer: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
    borderRadius: 12,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  resultCount: {
    marginBottom: 16,
    marginHorizontal: 4,
    fontSize: 14,
  },
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 102, 200, 0.8)',
  },
  loadMoreText: {
    color: '#FFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '90%', // Reduced to accommodate action buttons
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
});

function getStatusColor(status: string, theme: 'light' | 'dark') {
  switch (status) {
    case 'active':
      return theme === 'dark' ? Colors.dark.success : Colors.light.success;
    case 'completed':
      return theme === 'dark' ? Colors.dark.primary : Colors.light.primary;
    case 'cancelled':
    case 'expired':
      return theme === 'dark' ? Colors.dark.danger : Colors.light.danger;
    default:
      return theme === 'dark' ? Colors.dark.textSecondary : Colors.light.textSecondary;
  }
}