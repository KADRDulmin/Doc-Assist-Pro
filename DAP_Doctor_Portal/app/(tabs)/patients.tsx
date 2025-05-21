import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, View, Dimensions } from 'react-native';
import { Avatar, Searchbar, Divider, TouchableRipple } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import doctorService, { PatientData } from '../../services/doctorService';
import Colors from '../../constants/Colors';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import ModernHeader from '../../components/ui/ModernHeader';

export default function PatientsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      // Pass user ID to use the user-specific endpoint
      const response = await doctorService.getPatients(token, user?.id, searchQuery || undefined);
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} patients successfully`);
        setPatients(response.data);
        setFilteredPatients(response.data);
      } else {
        console.error('Failed to load patients:', response.error);
        setError(response.error || 'Failed to load patients');
      }
    } catch (err: any) {
      console.error('Error loading patients:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, searchQuery]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    loadPatients();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredPatients(patients);
      return;
    }
    
    const searchTerms = query.toLowerCase().trim().split(' ');
    
    const filtered = patients.filter(patient => {
      const fullName = `${patient.user.first_name} ${patient.user.last_name}`.toLowerCase();
      const email = patient.user.email.toLowerCase();
      const phone = patient.user.phone?.toLowerCase() || '';
      
      return searchTerms.some(term => 
        fullName.includes(term) || 
        email.includes(term) || 
        phone.includes(term)
      );
    });
    
    setFilteredPatients(filtered);
  };

  const handleSubmitSearch = () => {
    loadPatients();
  };

  const showPatientDetails = (patient: PatientData) => {
    setSelectedPatient(patient);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedPatient(null);
  };

  const navigateToMedicalHistory = (patient: PatientData) => {
    hideDialog();
    const patientName = `${patient.user.first_name} ${patient.user.last_name}`;
    router.push({
      pathname: '/patient/medical-history',
      params: { 
        patientId: patient.id.toString(),
        patientName: patientName
      }
    });
  };

  const renderPatientCard = ({ item }: { item: PatientData }) => {
    const upcomingCount = item.upcoming_appointments || 0;
    const fullName = `${item.user.first_name} ${item.user.last_name}`;
    const initials = `${item.user.first_name.charAt(0)}${item.user.last_name.charAt(0)}`;
    
    return (
      <TouchableRipple onPress={() => showPatientDetails(item)}>
        <ThemedView variant="card" useShadow style={styles.patientCard}>
          <View style={styles.patientCardContent}>
            <View style={styles.avatarContainer}>
              <Avatar.Text 
                size={50} 
                label={initials}
                style={[styles.avatar, { backgroundColor: Colors[theme].primary }]} 
              />
              {upcomingCount > 0 && (
                <View style={[styles.badgeUpcoming, { backgroundColor: Colors[theme].accent }]}>
                  <ThemedText style={styles.badgeText}>{upcomingCount}</ThemedText>
                </View>
              )}
            </View>
            
            <View style={styles.patientInfo}>
              <ThemedText weight="semibold" style={styles.patientName}>{fullName}</ThemedText>
              <ThemedText variant="secondary" style={styles.patientEmail}>{item.user.email}</ThemedText>
              {item.user.phone && (
                <ThemedText variant="tertiary" style={styles.patientPhone}>{item.user.phone}</ThemedText>
              )}
            </View>
            
            <View style={styles.patientStats}>
              <ThemedView variant="cardAlt" style={styles.statItem}>
                <ThemedText weight="semibold" style={[styles.statNumber, { color: Colors[theme].primary }]}>
                  {item.appointment_count}
                </ThemedText>
                <ThemedText variant="tertiary" style={styles.statLabel}>Total</ThemedText>
              </ThemedView>
              
              <ThemedView variant="cardAlt" style={styles.statItem}>
                <ThemedText weight="semibold" style={[styles.statNumber, { color: Colors[theme].success }]}>
                  {item.completed_appointments}
                </ThemedText>
                <ThemedText variant="tertiary" style={styles.statLabel}>Done</ThemedText>
              </ThemedView>
              
              <ThemedView variant="cardAlt" style={styles.statItem}>
                <ThemedText weight="semibold" style={[styles.statNumber, { color: Colors[theme].danger }]}>
                  {item.missed_appointments}
                </ThemedText>
                <ThemedText variant="tertiary" style={styles.statLabel}>Missed</ThemedText>
              </ThemedView>
            </View>
          </View>
        </ThemedView>
      </TouchableRipple>
    );
  };

  const renderPatientDialog = () => {
    if (!selectedPatient) return null;
    
    const patientName = `${selectedPatient.user.first_name} ${selectedPatient.user.last_name}`;
    const initials = `${selectedPatient.user.first_name.charAt(0)}${selectedPatient.user.last_name.charAt(0)}`;
    
    return (
      <ThemedView variant="card" style={styles.patientDetailCard}>
        <View style={styles.patientDetailHeader}>
          <ThemedText type="heading">Patient Details</ThemedText>
          <TouchableOpacity onPress={hideDialog} style={styles.closeButton}>
            <FontAwesome5 name="times" size={20} color={Colors[theme].text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.patientDetailContent}>
          <View style={styles.detailAvatarContainer}>
            <Avatar.Text 
              size={60}
              label={initials}
              style={[styles.detailAvatar, { backgroundColor: Colors[theme].primary }]}
            />
          </View>
          
          <ThemedText type="subheading" style={styles.detailName}>
            {patientName}
          </ThemedText>
          
          <View style={styles.detailContactContainer}>
            <View style={styles.detailContactItem}>
              <FontAwesome5 name="envelope" size={14} color={Colors[theme].primary} />
              <ThemedText variant="secondary" style={styles.detailContactText}>
                {selectedPatient.user.email}
              </ThemedText>
            </View>
            
            {selectedPatient.user.phone && (
              <View style={styles.detailContactItem}>
                <FontAwesome5 name="phone" size={14} color={Colors[theme].primary} />
                <ThemedText variant="secondary" style={styles.detailContactText}>
                  {selectedPatient.user.phone}
                </ThemedText>
              </View>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <ThemedText type="subheading" style={styles.appointmentSummaryTitle}>
            Appointment Summary
          </ThemedText>
          
          <View style={styles.statsGrid}>
            <ThemedView 
              variant="cardAlt" 
              style={[styles.statBox, { borderColor: Colors[theme].borderLight }]}
            >
              <ThemedText type="heading" style={styles.statBoxNumber}>
                {selectedPatient.appointment_count}
              </ThemedText>
              <ThemedText variant="secondary" style={styles.statBoxLabel}>Total</ThemedText>
            </ThemedView>
            
            <ThemedView 
              variant="cardAlt" 
              style={[styles.statBox, { borderColor: Colors[theme].borderLight }]}
            >
              <ThemedText type="heading" style={[styles.statBoxNumber, { color: Colors[theme].primary }]}>
                {selectedPatient.upcoming_appointments}
              </ThemedText>
              <ThemedText variant="secondary" style={styles.statBoxLabel}>Upcoming</ThemedText>
            </ThemedView>
            
            <ThemedView 
              variant="cardAlt" 
              style={[styles.statBox, { borderColor: Colors[theme].borderLight }]}
            >
              <ThemedText type="heading" style={[styles.statBoxNumber, { color: Colors[theme].success }]}>
                {selectedPatient.completed_appointments}
              </ThemedText>
              <ThemedText variant="secondary" style={styles.statBoxLabel}>Completed</ThemedText>
            </ThemedView>
            
            <ThemedView 
              variant="cardAlt" 
              style={[styles.statBox, { borderColor: Colors[theme].borderLight }]}
            >
              <ThemedText type="heading" style={[styles.statBoxNumber, { color: Colors[theme].danger }]}>
                {selectedPatient.missed_appointments}
              </ThemedText>
              <ThemedText variant="secondary" style={styles.statBoxLabel}>Missed</ThemedText>
            </ThemedView>          </View>

          <Divider style={styles.divider} />

          <ThemedText type="subheading" style={styles.appointmentSummaryTitle}>
            Medical Information
          </ThemedText>

          <View style={styles.medicalInfoContainer}>
            {selectedPatient.date_of_birth && (
              <View style={styles.medicalInfoItem}>
                <FontAwesome5 name="birthday-cake" size={14} color={Colors[theme].primary} />
                <View style={styles.medicalInfoContent}>
                  <ThemedText type="default" style={styles.medicalInfoLabel}>Date of Birth:</ThemedText>
                  <ThemedText variant="secondary" style={styles.medicalInfoValue}>
                    {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>
            )}

            {selectedPatient.blood_group && (
              <View style={styles.medicalInfoItem}>
                <FontAwesome5 name="tint" size={14} color={Colors[theme].primary} />
                <View style={styles.medicalInfoContent}>
                  <ThemedText type="default" style={styles.medicalInfoLabel}>Blood Group:</ThemedText>
                  <ThemedText variant="secondary" style={styles.medicalInfoValue}>
                    {selectedPatient.blood_group}
                  </ThemedText>
                </View>
              </View>
            )}

            {selectedPatient.allergies && (
              <View style={styles.medicalInfoItem}>
                <FontAwesome5 name="exclamation-triangle" size={14} color={Colors[theme].warning} />
                <View style={styles.medicalInfoContent}>
                  <ThemedText type="default" style={styles.medicalInfoLabel}>Allergies:</ThemedText>
                  <ThemedText variant="secondary" style={styles.medicalInfoValue}>
                    {selectedPatient.allergies}
                  </ThemedText>
                </View>
              </View>
            )}

            {selectedPatient.medical_history && (
              <View style={[styles.medicalInfoItem, {marginBottom: 0}]}>
                <FontAwesome5 name="file-medical-alt" size={14} color={Colors[theme].primary} />
                <View style={styles.medicalInfoContent}>
                  <ThemedText type="default" style={styles.medicalInfoLabel}>Prior Medical History:</ThemedText>
                  <ThemedText 
                    variant="secondary" 
                    style={styles.medicalInfoValue}
                    numberOfLines={3}
                  >
                    {selectedPatient.medical_history}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.actionButtonsContainer}>
            
            <TouchableRipple
              style={[styles.actionButton, { backgroundColor: Colors[theme].success }]}
              onPress={() => navigateToMedicalHistory(selectedPatient)}
            >
              <View style={styles.actionButtonContent}>
                <FontAwesome5 name="file-medical-alt" size={16} color="#FFF" />
                <ThemedText style={styles.actionButtonText}>Medical History</ThemedText>
              </View>
            </TouchableRipple>
          </View>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView variant="secondary" style={styles.container}>
      <ModernHeader 
        title="My Patients"
        showBackButton={false}
        userName={`Dr. ${user?.last_name || 'Smith'}`}
      />
      
      <Searchbar
        placeholder="Search patients"
        onChangeText={handleSearch}
        value={searchQuery}
        onSubmitEditing={handleSubmitSearch}
        style={[
          styles.searchbar,
          { backgroundColor: Colors[theme].card }
        ]}
        iconColor={Colors[theme].icon}
        inputStyle={{ color: Colors[theme].text }}
        placeholderTextColor={Colors[theme].textTertiary}
      />
      
      {error ? (
        <ThemedView variant="card" useShadow style={styles.errorContainer}>
          <ThemedText type="error" style={styles.errorText}>{error}</ThemedText>
          <TouchableRipple
            style={[styles.retryButton, { backgroundColor: Colors[theme].primary }]}
            onPress={loadPatients}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableRipple>
        </ThemedView>
      ) : loading && !refreshing ? (
        <ThemedView variant="card" useShadow style={styles.loadingContainer}>
          <FontAwesome5 name="user-md" size={40} color={Colors[theme].primary} />
          <ThemedText variant="secondary" style={styles.loadingText}>
            Loading patients...
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedView variant="card" useShadow style={styles.emptyContainer}>
              <FontAwesome5 
                name="user-friends" 
                size={50} 
                color={Colors[theme].textTertiary} 
              />
              <ThemedText variant="secondary" style={styles.emptyText}>
                {searchQuery ? 'No patients match your search' : 'No patients found'}
              </ThemedText>
            </ThemedView>
          }
        />
      )}
      
      {dialogVisible && renderPatientDialog()}
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  searchbar: {
    margin: 12,
    borderRadius: 8,
    elevation: 2,
  },
  errorContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  patientCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  patientCardContent: {
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    alignSelf: 'center',
  },
  badgeUpcoming: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  patientInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  patientName: {
    fontSize: 18,
    marginBottom: 4,
  },
  patientEmail: {
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 14,
  },
  patientStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  patientDetailCard: {
    position: 'absolute',
    top: '10%',
    left: width * 0.05,
    width: width * 0.9,
    borderRadius: 12,
    padding: 0,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  patientDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  patientDetailContent: {
    padding: 16,
    alignItems: 'center',
  },
  detailAvatarContainer: {
    marginVertical: 8,
  },
  detailAvatar: {
    marginBottom: 12,
  },
  detailName: {
    textAlign: 'center',
    marginBottom: 8,
  },
  detailContactContainer: {
    width: '100%',
    marginBottom: 16,
  },
  detailContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    justifyContent: 'center',
  },
  detailContactText: {
    marginLeft: 8,
  },
  divider: {
    width: '100%',
    marginVertical: 16,
  },
  appointmentSummaryTitle: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statBoxNumber: {
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    paddingVertical: 12,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  medicalInfoContainer: {
    width: '100%',
    marginBottom: 20,
  },
  medicalInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medicalInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  medicalInfoLabel: {
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 2,
  },
  medicalInfoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
});