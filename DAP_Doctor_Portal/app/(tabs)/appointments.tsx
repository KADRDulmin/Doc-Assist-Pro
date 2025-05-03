import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Searchbar, FAB, Dialog, Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import doctorService, { AppointmentData } from '../../services/doctorService';
import Colors from '../../constants/Colors';
import { MapComponent, DirectionsButton } from '../../components/maps';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      const response = await doctorService.getAppointments(token, user?.id, selectedFilter || undefined);
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} appointments successfully`);
        
        // For completed appointments, fetch feedback data
        const appointmentsWithFeedback = await Promise.all(
          response.data.map(async (appointment) => {
            if (appointment.status === 'completed') {
              try {
                // Fetch feedback for this appointment
                const feedbackResponse = await doctorService.getFeedbackByAppointment(appointment.id, token);
                if (feedbackResponse.success && feedbackResponse.data) {
                  return { ...appointment, feedback: feedbackResponse.data };
                }
              } catch (err) {
                console.log(`No feedback found for appointment ${appointment.id}`);
              }
            }
            return appointment;
          })
        );
        
        setAppointments(appointmentsWithFeedback);
        setFilteredAppointments(appointmentsWithFeedback);
      } else {
        console.error('Failed to load appointments:', response.error);
        setError(response.error || 'Failed to load appointments');
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    loadAppointments();
  };

  const filterAppointments = (status: string | null) => {
    setSelectedFilter(status);
  };

  const searchAppointments = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredAppointments(appointments);
      return;
    }
    
    const searchTerms = query.toLowerCase().trim().split(' ');
    
    const filtered = appointments.filter(appointment => {
      const patientName = appointment.patient?.name?.toLowerCase() || '';
      const appointmentDate = appointment.appointment_date;
      const appointmentTime = appointment.appointment_time;
      const appointmentType = (appointment.appointment_type || '').toLowerCase();
      
      return searchTerms.some(term => 
        patientName.includes(term) || 
        appointmentDate.includes(term) || 
        appointmentTime.includes(term) || 
        appointmentType.includes(term)
      );
    });
    
    setFilteredAppointments(filtered);
  };

  const showAppointmentDialog = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedAppointment(null);
  };

  const updateAppointmentStatus = async (status: 'completed' | 'cancelled') => {
    if (!selectedAppointment) return;
    
    try {
      setStatusUpdateLoading(true);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      const response = await doctorService.updateAppointmentStatus(
        selectedAppointment.id,
        status,
        token
      );
      
      if (response.success) {
        const updatedAppointments = appointments.map(apt => 
          apt.id === selectedAppointment.id ? { ...apt, status } : apt
        );
        
        setAppointments(updatedAppointments);
        setFilteredAppointments(
          filteredAppointments.map(apt => 
            apt.id === selectedAppointment.id ? { ...apt, status } : apt
          )
        );
        
        hideDialog();
      } else {
        setError(response.error || `Failed to mark appointment as ${status}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const formatDateString = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Parse location string to extract latitude and longitude if they exist
  const parseLocationString = (locationString?: string) => {
    if (!locationString) return null;
    
    // Try to extract coordinates from the location string
    // Common formats: "lat,lng" or "lat, lng" or "address (lat, lng)"
    const coordsRegex = /(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/;
    const match = locationString.match(coordsRegex);
    
    if (match && match.length >= 3) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
        address: locationString.replace(coordsRegex, '').trim()
      };
    }
    
    return null;
  };

  const renderAppointmentCard = (appointment: AppointmentData) => {
    const isUpcoming = appointment.status === 'upcoming';
    const isCompleted = appointment.status === 'completed';
    const isCancelled = appointment.status === 'cancelled';
    
    return (
      <Card 
        style={[
          styles.appointmentCard,
          isCompleted && styles.completedCard,
          isCancelled && styles.cancelledCard
        ]} 
        key={appointment.id}
        onPress={() => showAppointmentDialog(appointment)}
      >
        <Card.Content>
          <View style={styles.appointmentHeader}>
            <View>
              <Text style={styles.dateText}>
                {formatDateString(appointment.appointment_date)}
              </Text>
              <Text style={styles.timeText}>
                {appointment.appointment_time}
              </Text>
            </View>
            <Chip 
              style={[
                styles.statusChip,
                isUpcoming && styles.upcomingChip,
                isCompleted && styles.completedChip,
                isCancelled && styles.cancelledChip
              ]}
            >
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Chip>
          </View>

          <View style={styles.divider} />

          <View style={styles.patientInfo}>
            <View style={styles.patientNameRow}>
              <Text style={styles.patientName}>
                {appointment.patient?.name || 'Unknown Patient'}
              </Text>
              
              {/* Display star rating if feedback exists */}
              {appointment.feedback && (
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <MaterialIcons 
                      key={star}
                      name={star <= appointment.feedback!.rating ? "star" : "star-border"} 
                      size={16} 
                      color="#FFD700" 
                      style={{ marginHorizontal: 1 }}
                    />
                  ))}
                </View>
              )}
            </View>
            
            <Text style={styles.appointmentType}>
              {appointment.appointment_type || 'General Consultation'}
            </Text>
            {appointment.notes && (
              <Text style={styles.notes} numberOfLines={2}>
                Notes: {appointment.notes}
              </Text>
            )}
          </View>
        </Card.Content>
        
        {isUpcoming && (
          <Card.Actions style={styles.cardActions}>
            <Button 
              mode="outlined" 
              onPress={() => showAppointmentDialog(appointment)}
              style={styles.actionButton}
            >
              View Details
            </Button>
            <Button 
              mode="contained" 
              onPress={() => updateAppointmentStatus('completed')}
              style={[styles.actionButton, styles.completeButton]}
            >
              Complete
            </Button>
          </Card.Actions>
        )}
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search appointments"
        onChangeText={searchAppointments}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <Chip
          selected={selectedFilter === null}
          onPress={() => filterAppointments(null)}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={selectedFilter === 'upcoming'}
          onPress={() => filterAppointments('upcoming')}
          style={styles.filterChip}
        >
          Upcoming
        </Chip>
        <Chip
          selected={selectedFilter === 'completed'}
          onPress={() => filterAppointments('completed')}
          style={styles.filterChip}
        >
          Completed
        </Chip>
        <Chip
          selected={selectedFilter === 'cancelled'}
          onPress={() => filterAppointments('cancelled')}
          style={styles.filterChip}
        >
          Cancelled
        </Chip>
        <Chip
          selected={selectedFilter === 'missed'}
          onPress={() => filterAppointments('missed')}
          style={styles.filterChip}
        >
          Missed
        </Chip>
      </ScrollView>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadAppointments} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}
      
      <ScrollView
        style={styles.appointmentsContainer}
        contentContainerStyle={styles.appointmentsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.noAppointmentsContainer}>
            <Text style={styles.noAppointmentsText}>
              {searchQuery ? 'No appointments match your search' : 'No appointments found'}
            </Text>
          </View>
        ) : (
          filteredAppointments.map(renderAppointmentCard)
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog} style={styles.dialog}>
          {selectedAppointment && (
            <>
              <Dialog.Title>Appointment Details</Dialog.Title>
              <Dialog.ScrollArea style={styles.dialogScrollArea}>
                <ScrollView>
                  <Text style={styles.dialogText}>
                    <Text style={styles.dialogLabel}>Patient: </Text>
                    {selectedAppointment.patient?.name || 'Unknown Patient'}
                  </Text>
                  <Text style={styles.dialogText}>
                    <Text style={styles.dialogLabel}>Date: </Text>
                    {formatDateString(selectedAppointment.appointment_date)}
                  </Text>
                  <Text style={styles.dialogText}>
                    <Text style={styles.dialogLabel}>Time: </Text>
                    {selectedAppointment.appointment_time}
                  </Text>
                  <Text style={styles.dialogText}>
                    <Text style={styles.dialogLabel}>Type: </Text>
                    {selectedAppointment.appointment_type || 'General Consultation'}
                  </Text>
                  <Text style={styles.dialogText}>
                    <Text style={styles.dialogLabel}>Status: </Text>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </Text>
                  
                  {/* Location and map section */}
                  {selectedAppointment.location && (
                    <>
                      <Text style={styles.dialogText}>
                        <Text style={styles.dialogLabel}>Location: </Text>
                        {selectedAppointment.location}
                      </Text>
                      
                      {/* Parse location string to check if it has coordinates */}
                      {parseLocationString(selectedAppointment.location) && (
                        <View style={styles.mapContainer}>
                          <MapComponent
                            initialLocation={parseLocationString(selectedAppointment.location)!}
                            editable={false}
                            showDirectionsButton={true}
                            markerTitle={`Appointment with ${selectedAppointment.patient?.name || 'Patient'}`}
                            height={200}
                          />
                          
                          <View style={styles.directionsButtonContainer}>
                            <DirectionsButton
                              latitude={parseLocationString(selectedAppointment.location)!.latitude}
                              longitude={parseLocationString(selectedAppointment.location)!.longitude}
                              title={`Appointment with ${selectedAppointment.patient?.name || 'Patient'}`}
                            />
                          </View>
                        </View>
                      )}
                    </>
                  )}
                  
                  {selectedAppointment.notes && (
                    <Text style={styles.dialogText}>
                      <Text style={styles.dialogLabel}>Notes: </Text>
                      {selectedAppointment.notes}
                    </Text>
                  )}
                  
                  {/* Patient Symptoms Section (if available) */}
                  {selectedAppointment.symptoms && (
                    <>
                      <View style={styles.divider} />
                      <Text style={[styles.dialogText, styles.sectionTitle]}>Patient Symptoms</Text>
                      <Text style={styles.dialogText}>{selectedAppointment.symptoms}</Text>
                      
                      {selectedAppointment.possible_illness_1 && (
                        <Text style={styles.dialogText}>
                          <Text style={styles.dialogLabel}>Possible Diagnosis: </Text>
                          {selectedAppointment.possible_illness_1}
                          {selectedAppointment.possible_illness_2 && `, ${selectedAppointment.possible_illness_2}`}
                        </Text>
                      )}
                      
                      {selectedAppointment.criticality && (
                        <Text style={[
                          styles.dialogText, 
                          selectedAppointment.criticality.toLowerCase() === 'high' && styles.criticalText
                        ]}>
                          <Text style={styles.dialogLabel}>Criticality: </Text>
                          {selectedAppointment.criticality}
                        </Text>
                      )}
                    </>
                  )}
                  
                  {/* Patient Feedback Section */}
                  {selectedAppointment.feedback && (
                    <>
                      <View style={styles.divider} />
                      <Text style={[styles.dialogText, styles.sectionTitle]}>Patient Feedback</Text>
                      
                      <View style={styles.dialogRatingContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <MaterialIcons 
                            key={star}
                            name={star <= selectedAppointment.feedback!.rating ? "star" : "star-border"} 
                            size={20} 
                            color="#FFD700" 
                            style={{ marginRight: 2 }}
                          />
                        ))}
                        <Text style={styles.ratingText}>
                          ({selectedAppointment.feedback.rating}/5)
                        </Text>
                      </View>
                      
                      {selectedAppointment.feedback.comment && (
                        <View style={styles.feedbackCommentContainer}>
                          <Text style={styles.feedbackComment}>
                            "{selectedAppointment.feedback.comment}"
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={hideDialog}>Close</Button>
                {selectedAppointment.status === 'upcoming' && (
                  <>
                    <Button 
                      onPress={() => updateAppointmentStatus('cancelled')}
                      loading={statusUpdateLoading}
                      disabled={statusUpdateLoading}
                      color="#F44336"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onPress={() => updateAppointmentStatus('completed')}
                      loading={statusUpdateLoading}
                      disabled={statusUpdateLoading}
                      color="#4CAF50"
                    >
                      Complete
                    </Button>
                  </>
                )}
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>

      <FAB
        style={styles.fab}
        icon="calendar-plus"
        label="Schedule"
        onPress={() => console.log('Schedule new appointment')}
      />
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
  filterContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  appointmentsContainer: {
    flex: 1,
  },
  appointmentsContent: {
    padding: 10,
    paddingBottom: 80, // For FAB space
  },
  appointmentCard: {
    marginBottom: 10,
    elevation: 2,
  },
  completedCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  cancelledCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
    opacity: 0.8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#555',
  },
  statusChip: {
    height: 28,
  },
  upcomingChip: {
    backgroundColor: Colors.light.primary,
  },
  completedChip: {
    backgroundColor: '#4CAF50',
  },
  cancelledChip: {
    backgroundColor: '#F44336',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  patientInfo: {
    marginTop: 5,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
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
  noAppointmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.primary,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  dialogText: {
    marginBottom: 8,
    fontSize: 16,
  },
  dialogLabel: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  dialogRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#555',
  },
  feedbackCommentContainer: {
    marginTop: 8,
  },
  feedbackComment: {
    fontStyle: 'italic',
    color: '#555',
  },
  mapContainer: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  directionsButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  criticalText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
});