import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, Divider, Avatar, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/src/hooks/useAuth';
import patientService from '@/src/services/patient.service';
import { Colors } from '@/constants/Colors';

// Define interface for doctor data
interface ConsultedDoctor {
  id: number;
  name: string;
  specialization: string;
  lastConsultationDate: string;
  imageUrl?: string;
}

export default function FollowUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<ConsultedDoctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<ConsultedDoctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch previously consulted doctors
  useEffect(() => {
    fetchConsultedDoctors();
  }, []);

  const fetchConsultedDoctors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await patientService.getConsultedDoctors();
      
      if (response.success && response.data) {
        setDoctors(response.data);
        setFilteredDoctors(response.data);
      } else {
        setError(response.message || 'Failed to load your previously consulted doctors');
      }
    } catch (err) {
      console.error('Error fetching consulted doctors:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter doctors based on search query
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredDoctors(doctors);
      return;
    }
    
    const filtered = doctors.filter(doctor => {
      const doctorName = doctor.name.toLowerCase();
      const specialization = doctor.specialization.toLowerCase();
      const searchLower = query.toLowerCase();
      
      return doctorName.includes(searchLower) || specialization.includes(searchLower);
    });
    
    setFilteredDoctors(filtered);
  };

  // Handle doctor selection
  const handleSelectDoctor = (doctor: ConsultedDoctor) => {
    // Navigate to the appointment booking screen with the selected doctor
    router.push({
      pathname: '/appointments/book',
      params: { 
        doctorId: doctor.id.toString(),
        doctorName: doctor.name,
        specialization: doctor.specialization,
        appointmentType: 'follow-up'
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={styles.loadingText}>Loading your doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Follow-up Appointment</Text>
        <Text style={styles.headerSubtitle}>
          Select a doctor you've previously consulted with
        </Text>
      </View>

      <Searchbar
        placeholder="Search doctors by name or specialization"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={[
          styles.searchBar,
          colorScheme === 'dark' && styles.searchBarDark
        ]}
        inputStyle={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}
        iconColor={colorScheme === 'dark' ? '#fff' : '#666'}
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#999'}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchConsultedDoctors}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="user-md" size={50} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery 
              ? "No doctors match your search" 
              : "You haven't consulted with any doctors yet"}
          </Text>
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.newConsultationButton}
              onPress={() => router.push('/symptom-analysis')}
            >
              <Text style={styles.newConsultationButtonText}>Start New Consultation</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.doctorCard}
              onPress={() => handleSelectDoctor(item)}
            >
              <View style={styles.doctorInfo}>
                <Avatar.Icon 
                  size={60} 
                  icon="doctor" 
                  style={styles.avatar}
                  color="#fff" 
                />
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorName}>{item.name}</Text>
                  <View style={styles.specializationContainer}>
                    <FontAwesome5 name="stethoscope" size={12} color={Colors[colorScheme ?? 'light'].tint} />
                    <Text style={styles.specialization}>{item.specialization}</Text>
                  </View>
                  <Text style={styles.lastConsultation}>
                    Last consultation: {item.lastConsultationDate}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={Colors[colorScheme ?? 'light'].text} 
                style={{ opacity: 0.5 }}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchBarDark: {
    backgroundColor: '#333',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: Colors.light.tint,
  },
  doctorDetails: {
    marginLeft: 15,
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  specializationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    marginLeft: 6,
    color: '#555',
  },
  lastConsultation: {
    fontSize: 12,
    color: '#777',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },
  newConsultationButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  newConsultationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  clearSearchButton: {
    paddingVertical: 10,
  },
  clearSearchButtonText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});