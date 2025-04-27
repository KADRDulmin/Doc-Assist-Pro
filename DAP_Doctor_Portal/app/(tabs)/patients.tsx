import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Badge, Button, ActivityIndicator, Searchbar, Portal, Dialog, Divider } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import doctorService, { PatientData } from '../../services/doctorService';
import Colors from '../../constants/Colors';

export default function PatientsScreen() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const loadPatients = async () => {
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
  };

  useEffect(() => {
    loadPatients();
  }, []);

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

  const renderPatientCard = ({ item }: { item: PatientData }) => {
    const upcomingCount = item.upcoming_appointments || 0;
    const fullName = `${item.user.first_name} ${item.user.last_name}`;
    const initials = `${item.user.first_name.charAt(0)}${item.user.last_name.charAt(0)}`;
    
    return (
      <Card style={styles.patientCard} onPress={() => showPatientDetails(item)}>
        <Card.Content style={styles.patientCardContent}>
          <View style={styles.avatarContainer}>
            <Avatar.Text 
              size={50} 
              label={initials}
              style={styles.avatar} 
            />
            {upcomingCount > 0 && (
              <Badge style={styles.badgeUpcoming}>{upcomingCount}</Badge>
            )}
          </View>
          
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{fullName}</Text>
            <Text style={styles.patientEmail}>{item.user.email}</Text>
            {item.user.phone && (
              <Text style={styles.patientPhone}>{item.user.phone}</Text>
            )}
          </View>
          
          <View style={styles.patientStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.appointment_count}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.completed_appointments}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.cancelled_appointments}</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search patients"
        onChangeText={handleSearch}
        value={searchQuery}
        onSubmitEditing={handleSubmitSearch}
        style={styles.searchbar}
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadPatients} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}
      
      <FlatList
        data={filteredPatients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="user-friends" size={50} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No patients match your search' : 'No patients found'}
            </Text>
          </View>
        }
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog} style={styles.dialog}>
          {selectedPatient && (
            <>
              <Dialog.Title style={styles.dialogTitle}>
                Patient Details
              </Dialog.Title>
              <Dialog.Content>
                <View style={styles.dialogHeader}>
                  <Avatar.Text 
                    size={60}
                    label={`${selectedPatient.user.first_name.charAt(0)}${selectedPatient.user.last_name.charAt(0)}`}
                    style={styles.dialogAvatar}
                  />
                  <View style={styles.dialogPatientInfo}>
                    <Text style={styles.dialogPatientName}>
                      {selectedPatient.user.first_name} {selectedPatient.user.last_name}
                    </Text>
                    <TouchableOpacity>
                      <Text style={styles.dialogPatientEmail}>
                        {selectedPatient.user.email}
                      </Text>
                    </TouchableOpacity>
                    {selectedPatient.user.phone && (
                      <TouchableOpacity>
                        <Text style={styles.dialogPatientPhone}>
                          {selectedPatient.user.phone}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Divider style={styles.dialogDivider} />

                <Text style={styles.sectionTitle}>Appointment Summary</Text>
                <View style={styles.appointmentStatsContainer}>
                  <View style={[styles.appointmentStat, styles.totalStat]}>
                    <Text style={styles.appointmentStatNumber}>
                      {selectedPatient.appointment_count}
                    </Text>
                    <Text style={styles.appointmentStatLabel}>Total</Text>
                  </View>
                  <View style={[styles.appointmentStat, styles.upcomingStat]}>
                    <Text style={styles.appointmentStatNumber}>
                      {selectedPatient.upcoming_appointments}
                    </Text>
                    <Text style={styles.appointmentStatLabel}>Upcoming</Text>
                  </View>
                  <View style={[styles.appointmentStat, styles.completedStat]}>
                    <Text style={styles.appointmentStatNumber}>
                      {selectedPatient.completed_appointments}
                    </Text>
                    <Text style={styles.appointmentStatLabel}>Completed</Text>
                  </View>
                  <View style={[styles.appointmentStat, styles.cancelledStat]}>
                    <Text style={styles.appointmentStatNumber}>
                      {selectedPatient.cancelled_appointments}
                    </Text>
                    <Text style={styles.appointmentStatLabel}>Cancelled</Text>
                  </View>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={hideDialog}>Close</Button>
                <Button 
                  mode="contained"
                  onPress={() => {
                    hideDialog();
                    // Navigate to patient appointments
                    console.log(`View appointments for patient: ${selectedPatient.id}`);
                  }}
                  style={styles.viewAppointmentsButton}
                >
                  View Appointments
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    hideDialog();
                    // Schedule new appointment
                    console.log(`Schedule appointment for patient: ${selectedPatient.id}`);
                  }}
                  style={styles.scheduleButton}
                >
                  Schedule Appointment
                </Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
    </View>
  );
}

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
  searchbar: {
    margin: 10,
    elevation: 2,
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
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  patientCard: {
    marginBottom: 10,
    elevation: 2,
  },
  patientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    backgroundColor: Colors.light.primary,
  },
  badgeUpcoming: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
  },
  patientPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  patientStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 40,
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
  },
  dialog: {
    borderRadius: 10,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 20,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dialogAvatar: {
    backgroundColor: Colors.light.primary,
    marginRight: 15,
  },
  dialogPatientInfo: {
    flex: 1,
  },
  dialogPatientName: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  dialogPatientEmail: {
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 2,
  },
  dialogPatientPhone: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  dialogDivider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  appointmentStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  appointmentStat: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    minWidth: 70,
    backgroundColor: '#eee',
  },
  totalStat: {
    backgroundColor: '#E3F2FD',
  },
  upcomingStat: {
    backgroundColor: '#FFF3E0',
  },
  completedStat: {
    backgroundColor: '#E8F5E9',
  },
  cancelledStat: {
    backgroundColor: '#FFEBEE',
  },
  appointmentStatNumber: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  appointmentStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewAppointmentsButton: {
    marginLeft: 8,
    backgroundColor: Colors.light.primary,
  },
  scheduleButton: {
    marginLeft: 8,
    backgroundColor: '#4CAF50',
  },
});