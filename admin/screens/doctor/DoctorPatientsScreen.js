import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Card } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

// This would typically come from a service file
const getDoctorPatients = async (searchTerm = '') => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Demo data for display purposes
  const demoPatients = [
    {
      id: '1',
      name: 'John Smith',
      age: 45,
      gender: 'Male',
      contact: '123-456-7890',
      lastVisit: '2023-05-20',
      medicalConditions: ['Hypertension', 'Diabetes'],
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      age: 32,
      gender: 'Female',
      contact: '555-123-4567',
      lastVisit: '2023-06-01',
      medicalConditions: ['Asthma'],
    },
    {
      id: '3',
      name: 'Robert Chen',
      age: 58,
      gender: 'Male',
      contact: '987-654-3210',
      lastVisit: '2023-05-15',
      medicalConditions: ['Arthritis', 'Hypertension'],
    },
    {
      id: '4',
      name: 'Emily Davis',
      age: 29,
      gender: 'Female',
      contact: '444-333-2222',
      lastVisit: '2023-06-10',
      medicalConditions: [],
    },
    {
      id: '5',
      name: 'Michael Brown',
      age: 41,
      gender: 'Male',
      contact: '777-888-9999',
      lastVisit: '2023-05-25',
      medicalConditions: ['GERD', 'Insomnia'],
    },
  ];
  
  // Filter by search term if provided
  if (searchTerm) {
    return demoPatients.filter(patient => 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.medicalConditions.some(condition => 
        condition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }
  
  return demoPatients;
};

const DoctorPatientsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (term = searchTerm) => {
    if (!refreshing) setIsLoading(true);
    try {
      const data = await getDoctorPatients(term);
      setPatients(data);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load patients');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    loadPatients(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm('');
    loadPatients('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  const renderPatientItem = ({ item }) => (
    <Card containerStyle={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View>
          <Text style={styles.patientName}>{item.name}</Text>
          <View style={styles.patientSubheader}>
            <Text style={styles.patientDetail}>{item.age} years</Text>
            <Text style={styles.patientDetail}>•</Text>
            <Text style={styles.patientDetail}>{item.gender}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => Alert.alert('View Patient', `View details for ${item.name}`)}
        >
          <MaterialIcons name="visibility" size={20} color={Colors.primary} />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
      
      <Card.Divider />
      
      <View style={styles.patientDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={16} color={Colors.primary} style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Contact:</Text>
          <Text style={styles.detailValue}>{item.contact}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={16} color={Colors.primary} style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Last Visit:</Text>
          <Text style={styles.detailValue}>{item.lastVisit}</Text>
        </View>
        
        <View style={styles.conditionsContainer}>
          <Text style={styles.conditionsLabel}>Medical Conditions:</Text>
          {item.medicalConditions.length > 0 ? (
            <View style={styles.conditionsTags}>
              {item.medicalConditions.map((condition, index) => (
                <View key={index} style={styles.conditionTag}>
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noConditionsText}>No conditions reported</Text>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.appointmentButton]}
          onPress={() => Alert.alert('Schedule', `Schedule appointment for ${item.name}`)}
        >
          <MaterialIcons name="event-available" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.historyButton]}
          onPress={() => Alert.alert('History', `View medical history for ${item.name}`)}
        >
          <MaterialIcons name="history" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => Alert.alert('Message', `Send message to ${item.name}`)}
        >
          <MaterialIcons name="message" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.grey} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients or conditions"
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={clearSearch}>
              <MaterialIcons name="clear" size={20} color={Colors.grey} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {/* Patient list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-search" size={60} color={Colors.grey} />
              <Text style={styles.emptyText}>No patients found</Text>
              {searchTerm ? (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={clearSearch}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
      
      {/* Floating add button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => Alert.alert('Add Patient', 'Add a new patient')}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
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
  listContainer: {
    padding: 10,
    paddingBottom: 80, // Extra padding at the bottom for the floating button
  },
  patientCard: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  patientSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  patientDetail: {
    fontSize: 14,
    color: Colors.grey,
    marginRight: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewButtonText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  patientDetails: {
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
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  conditionsContainer: {
    marginTop: 5,
  },
  conditionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.grey,
    marginBottom: 8,
  },
  conditionsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionTag: {
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 12,
    color: Colors.primary,
  },
  noConditionsText: {
    fontSize: 14,
    color: Colors.grey,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
  appointmentButton: {
    backgroundColor: Colors.primary,
  },
  historyButton: {
    backgroundColor: Colors.secondary,
  },
  messageButton: {
    backgroundColor: Colors.success,
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
  clearSearchButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default DoctorPatientsScreen;
