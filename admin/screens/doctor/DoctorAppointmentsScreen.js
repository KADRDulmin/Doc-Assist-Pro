import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Card } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import { getDoctorAppointments } from '../../services/doctorService';
import Colors from '../../constants/Colors';

const DoctorAppointmentsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [activeFilter]);

  const loadAppointments = async () => {
    if (!refreshing) setIsLoading(true);
    try {
      const data = await getDoctorAppointments(activeFilter);
      setAppointments(data || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load appointments');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Filter buttons for different appointment views
  const FilterButton = ({ title, filter }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter ? styles.activeFilterButton : null
      ]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter ? styles.activeFilterButtonText : null
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const getAppointmentStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <MaterialIcons name="check-circle" size={20} color={Colors.success} />;
      case 'cancelled':
        return <MaterialIcons name="cancel" size={20} color={Colors.error} />;
      case 'confirmed':
        return <MaterialIcons name="event-available" size={20} color={Colors.primary} />;
      case 'pending':
      default:
        return <MaterialIcons name="schedule" size={20} color={Colors.warning} />;
    }
  };

  const renderAppointmentItem = ({ item }) => (
    <Card containerStyle={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfoContainer}>
          <Text style={styles.patientName}>{item.patient_name || 'Patient Name'}</Text>
          <Text style={styles.appointmentId}>ID: {item.id || '#12345'}</Text>
        </View>
        <View style={styles.statusContainer}>
          {getAppointmentStatusIcon(item.status)}
          <Text style={styles.statusText}>{item.status || 'pending'}</Text>
        </View>
      </View>

      <Card.Divider />

      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={18} color={Colors.primary} style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{item.date || '2023-05-15'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={18} color={Colors.primary} style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>{item.time || '10:00 AM'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="medical-services" size={18} color={Colors.primary} style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.appointment_type || 'General Checkup'}</Text>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtonsContainer}>
        {item.status !== 'completed' && item.status !== 'cancelled' && (
          <>
            <TouchableOpacity style={[styles.actionButton, styles.completeButton]}>
              <MaterialIcons name="check" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]}>
              <MaterialIcons name="event" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reschedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
              <MaterialIcons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={[styles.actionButton, styles.detailsButton]}>
          <MaterialIcons name="visibility" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  // Demo data when there's no real data
  const getDemoData = () => {
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const types = ['General Checkup', 'Follow-up', 'Consultation', 'Urgent Care'];
    
    return Array(5).fill(0).map((_, i) => ({
      id: `A${1000 + i}`,
      patient_name: `Patient ${i + 1}`,
      date: `2023-06-${10 + i}`,
      time: `${9 + i}:00 AM`,
      status: statuses[i % statuses.length],
      appointment_type: types[i % types.length],
      notes: i % 2 === 0 ? 'Patient has reported recurring headaches for the past week.' : null
    }));
  };

  // Use demo data if no appointments are loaded
  const displayAppointments = appointments.length ? appointments : getDemoData();

  return (
    <View style={styles.container}>
      {/* Filter buttons */}
      <View style={styles.filtersContainer}>
        <FilterButton title="Upcoming" filter="upcoming" />
        <FilterButton title="Today" filter="today" />
        <FilterButton title="Completed" filter="completed" />
        <FilterButton title="Cancelled" filter="cancelled" />
      </View>

      {/* Appointment list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={displayAppointments}
          renderItem={renderAppointmentItem}
          keyExtractor={(item, index) => item.id?.toString() || `appointment-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={60} color={Colors.grey} />
              <Text style={styles.emptyText}>No appointments found</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={onRefresh}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.grey,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.text,
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  appointmentCard: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientInfoContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  appointmentId: {
    fontSize: 12,
    color: Colors.grey,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
    textTransform: 'capitalize',
  },
  appointmentDetails: {
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.grey,
    width: 50,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.grey,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
    flex: 1,
    marginHorizontal: 2,
  },
  completeButton: {
    backgroundColor: Colors.success,
  },
  rescheduleButton: {
    backgroundColor: Colors.warning,
  },
  cancelButton: {
    backgroundColor: Colors.error,
  },
  detailsButton: {
    backgroundColor: Colors.secondary,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.grey,
    marginTop: 10,
  },
  refreshButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default DoctorAppointmentsScreen;
