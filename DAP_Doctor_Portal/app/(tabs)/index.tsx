import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import doctorService, { DashboardData, AppointmentData } from '../../services/doctorService';
import authService from '../../services/authService';
import Colors from '../../constants/Colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      // Load dashboard data
      const dashboardResponse = await doctorService.getDashboard(token, user?.id);
      
      if (dashboardResponse.success && dashboardResponse.data) {
        console.log('Dashboard data loaded successfully');
        setDashboardData(dashboardResponse.data);
        
        // Use the new endpoint to get today's appointments
        const appointmentsResponse = await doctorService.getTodayAppointments(token);
        
        if (appointmentsResponse.success && appointmentsResponse.data) {
          console.log('Today\'s appointments loaded successfully');
          setTodayAppointments(appointmentsResponse.data);
        } else {
          console.error('Failed to load today\'s appointments:', appointmentsResponse.error);
          // If the today's appointments endpoint fails, fall back to dashboard data
          if (dashboardResponse.data.todayAppointments) {
            setTodayAppointments(dashboardResponse.data.todayAppointments);
          }
        }
      } else {
        console.error('Failed to load dashboard:', dashboardResponse.error);
        setError(dashboardResponse.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadDashboard} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : (
        <>
          <Card style={styles.welcomeCard}>
            <Card.Content>
              <Title style={styles.welcomeTitle}>
                Welcome, Dr. {user?.first_name} {user?.last_name}
              </Title>
              <Paragraph>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Paragraph>
            </Card.Content>
          </Card>

          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Avatar.Icon size={40} icon="calendar" style={styles.statIcon} />
                <View>
                  <Text style={styles.statValue}>
                    {dashboardData?.stats?.appointmentCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>Appointments</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Avatar.Icon size={40} icon="account-group" style={styles.statIcon} />
                <View>
                  <Text style={styles.statValue}>
                    {dashboardData?.stats?.patientCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>Patients</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Avatar.Icon size={40} icon="check-circle" style={styles.statIcon} />
                <View>
                  <Text style={styles.statValue}>
                    {dashboardData?.stats?.completedAppointments || 0}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          <Card style={styles.sectionCard}>
            <Card.Title title="Today's Appointments" />
            <Card.Content>
              {todayAppointments && todayAppointments.length > 0 ? (
                todayAppointments.map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <View style={styles.appointmentItem}>
                      <View style={styles.appointmentTimeContainer}>
                        <Text style={styles.appointmentTime}>
                          {appointment.appointment_time || appointment.time}
                        </Text>
                      </View>
                      <View style={styles.appointmentDetails}>
                        <Text style={styles.patientName}>
                          {appointment.patient?.name || 'Unknown Patient'}
                        </Text>
                        <Text style={styles.appointmentType}>
                          {appointment.appointment_type || appointment.type || 'General'}
                        </Text>
                      </View>
                      <Button
                        mode="contained"
                        compact
                        style={[
                          styles.statusButton,
                          appointment.status === 'upcoming'
                            ? styles.upcomingButton
                            : appointment.status === 'completed'
                            ? styles.completedButton
                            : styles.cancelledButton,
                        ]}
                        onPress={() => Alert.alert('Appointment Details', `View details for appointment with ${appointment.patient?.name || 'Unknown Patient'}`)}
                      >
                        {appointment.status === 'upcoming'
                          ? 'Upcoming'
                          : appointment.status === 'completed'
                          ? 'Completed'
                          : 'Cancelled'}
                      </Button>
                    </View>
                    {index < todayAppointments.length - 1 && <Divider style={styles.divider} />}
                  </React.Fragment>
                ))
              ) : (
                <Text style={styles.noAppointmentsText}>No appointments for today</Text>
              )}
            </Card.Content>
            <Card.Actions>
              <Button
                mode="text"
                onPress={() => Alert.alert('View All Appointments', 'Navigate to appointments screen')}
              >
                View All
              </Button>
            </Card.Actions>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
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
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    width: 150,
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: 10,
  },
  statIcon: {
    backgroundColor: Colors.light.primary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  appointmentTimeContainer: {
    width: 60,
    alignItems: 'center',
  },
  appointmentTime: {
    fontWeight: 'bold',
  },
  appointmentDetails: {
    flex:1,
    marginLeft: 8,
  },
  patientName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
  },
  statusButton: {
    borderRadius: 5,
  },
  upcomingButton: {
    backgroundColor: Colors.light.primary,
  },
  completedButton: {
    backgroundColor: '#4CAF50',
  },
  cancelledButton: {
    backgroundColor: '#F44336',
  },
  divider: {
    marginVertical: 8,
  },
  noAppointmentsText: {
    textAlign: 'center',
    padding: 10,
    fontStyle: 'italic',
  },
});
