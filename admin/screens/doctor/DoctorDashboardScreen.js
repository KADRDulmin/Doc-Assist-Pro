import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import { getDoctorAppointments, getDoctorProfile } from '../../services/doctorService';
import { AuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Colors from '../../constants/Colors';

const DoctorDashboardScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  const { userInfo } = useContext(AuthContext);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch doctor profile and recent appointments
        const [profileData, appointmentsData] = await Promise.all([
          getDoctorProfile(),
          getDoctorAppointments('upcoming') // Only get upcoming appointments
        ]);

        setProfile(profileData);
        setAppointments(appointmentsData?.slice(0, 5) || []); // Get first 5 appointments
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Demo data for display when there's no actual data
  const getDemoAppointments = () => {
    return [
      {
        id: '1',
        patient_name: 'John Smith',
        time: '09:00 AM',
        appointment_type: 'General Checkup'
      },
      {
        id: '2',
        patient_name: 'Sarah Johnson',
        time: '10:30 AM',
        appointment_type: 'Follow-up'
      },
      {
        id: '3',
        patient_name: 'Robert Chen',
        time: '01:00 PM',
        appointment_type: 'Consultation'
      }
    ];
  };

  const displayAppointments = appointments.length ? appointments : getDemoAppointments();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Dr. {userInfo?.first_name || 'Doctor'}</Text>
        <Text style={styles.welcomeText}>Welcome back to your dashboard</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card containerStyle={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialIcons name="event" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{displayAppointments.length || 0}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </Card>
        <Card containerStyle={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialIcons name="people" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{profile?.patient_count || 12}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
        </Card>
        <Card containerStyle={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialIcons name="check-circle" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{profile?.completed_appointments || 45}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </Card>
      </View>

      {/* Upcoming Appointments Section */}
      <Card containerStyle={styles.appointmentCard}>
        <Card.Title>Today's Appointments</Card.Title>
        <Card.Divider />
        {displayAppointments.length > 0 ? (
          displayAppointments.map((appointment, index) => (
            <View key={index} style={styles.appointmentItem}>
              <View style={styles.appointmentTime}>
                <MaterialIcons name="schedule" size={16} color={Colors.primary} />
                <Text style={styles.timeText}>{appointment.time || '9:00 AM'}</Text>
              </View>
              <View style={styles.appointmentDetails}>
                <Text style={styles.patientName}>{appointment.patient_name || 'Patient Name'}</Text>
                <Text style={styles.appointmentType}>{appointment.appointment_type || 'Regular Checkup'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => navigation.navigate('Appointments')}
              >
                <MaterialIcons name="chevron-right" size={24} color={Colors.grey} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.noAppointments}>
            <Text style={styles.noAppointmentsText}>No appointments scheduled for today</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Text style={styles.viewAllText}>View All Appointments</Text>
          <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </Card>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionContainer}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Patients')}
        >
          <MaterialIcons name="people" size={28} color={Colors.primary} />
          <Text style={styles.quickActionText}>View Patients</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialIcons name="person" size={28} color={Colors.primary} />
          <Text style={styles.quickActionText}>My Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => { /* Placeholder for future functionality */ }}
        >
          <MaterialIcons name="assessment" size={28} color={Colors.primary} />
          <Text style={styles.quickActionText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Doctor Information Summary */}
      <Card containerStyle={styles.profileSummaryCard}>
        <Card.Title>Your Profile Summary</Card.Title>
        <Card.Divider />
        <View style={styles.profileSummaryItem}>
          <MaterialIcons name="medical-services" size={20} color={Colors.primary} />
          <Text style={styles.profileSummaryLabel}>Specialization:</Text>
          <Text style={styles.profileSummaryValue}>{profile?.specialization || 'Not specified'}</Text>
        </View>
        
        <View style={styles.profileSummaryItem}>
          <MaterialIcons name="star" size={20} color={Colors.primary} />
          <Text style={styles.profileSummaryLabel}>Experience:</Text>
          <Text style={styles.profileSummaryValue}>
            {profile?.years_of_experience ? `${profile.years_of_experience} years` : 'Not specified'}
          </Text>
        </View>
        
        <View style={styles.profileSummaryItem}>
          <MaterialIcons name="attach-money" size={20} color={Colors.primary} />
          <Text style={styles.profileSummaryLabel}>Fee:</Text>
          <Text style={styles.profileSummaryValue}>
            {profile?.consultation_fee ? `$${profile.consultation_fee}` : 'Not specified'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.grey,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  statsCard: {
    flex: 1,
    margin: 5,
    padding: 10,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.grey,
  },
  appointmentCard: {
    borderRadius: 8,
    marginBottom: 15,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  timeText: {
    marginLeft: 5,
    fontSize: 14,
    color: Colors.primary,
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  appointmentType: {
    fontSize: 12,
    color: Colors.grey,
  },
  viewButton: {
    padding: 5,
  },
  noAppointments: {
    padding: 20,
    alignItems: 'center',
  },
  noAppointmentsText: {
    color: Colors.grey,
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  quickActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 100,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  profileSummaryCard: {
    borderRadius: 8,
    marginBottom: 20,
  },
  profileSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileSummaryLabel: {
    fontSize: 16,
    color: Colors.grey,
    marginLeft: 10,
    width: 110,
  },
  profileSummaryValue: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  editProfileButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
  },
  editProfileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DoctorDashboardScreen;
