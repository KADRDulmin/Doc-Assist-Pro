import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View, Dimensions } from 'react-native';
import { Avatar, Card, Divider, TouchableRipple } from 'react-native-paper';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import doctorService, { DashboardData, AppointmentData } from '../../services/doctorService';
import authService from '../../services/authService';
import Colors from '../../constants/Colors';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import ModernHeader from '../../components/ui/ModernHeader';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
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
  }, [user?.id]);

  const handleStartConsultation = (appointmentId: number) => {
    router.push(`/consultation/${appointmentId}` as any);
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };  const getStatusColor = (status: string | undefined) => {
    if (!status) return Colors[theme].textTertiary;
    
    switch (status.toLowerCase()) {
      case 'upcoming':
        return Colors[theme].primary;
      case 'completed':
        return Colors[theme].success;
      case 'cancelled':
        return Colors[theme].danger;
      case 'missed':
        return '#FF9800'; // amber
      default:
        return Colors[theme].textTertiary;
    }
  };// Helper function to get patient display name
  const getPatientDisplayName = (appointment: AppointmentData): string => {
    try {
      // Check if appointment is null or undefined
      if (!appointment) {
        return 'Unknown Patient';
      }
      
      // Check if patient exists with user property
      if (appointment.patient?.user) {
        const firstName = appointment.patient.user.first_name || '';
        const lastName = appointment.patient.user.last_name || '';
        return `${firstName} ${lastName}`.trim() || 'Unknown Patient';
      }
      
      // Fallback to name property if it exists
      if (appointment.patient?.name) {
        return appointment.patient.name;
      }
      
      // Default fallback
      return 'Unknown Patient';
    } catch (err) {
      console.error('Error formatting patient name:', err);
      return 'Unknown Patient';
    }
  };

  return (
    <ThemedView variant="secondary" style={styles.container}>
      <ModernHeader 
        title="Doctor Dashboard"
        showBackButton={false}
        userName={`Dr. ${user?.last_name || 'Smith'}`}
      />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <ThemedView variant="card" useShadow style={styles.errorContainer}>
            <ThemedText type="error" style={styles.errorText}>{error}</ThemedText>
            <TouchableRipple
              style={styles.retryButton}
              onPress={loadDashboard}
              borderless
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableRipple>
          </ThemedView>
        ) : loading && !refreshing ? (
          <ThemedView variant="card" useShadow style={styles.loadingContainer}>
            <FontAwesome5 name="stethoscope" size={40} color={Colors[theme].primary} />
            <ThemedText variant="secondary" style={styles.loadingText}>
              Loading your dashboard...
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {/* Welcome Card */}
            <ThemedView variant="card" useShadow style={styles.welcomeCard}>
              <View style={styles.welcomeCardContent}>
                <View style={styles.welcomeInfo}>
                  <ThemedText type="heading">
                    Welcome, Dr. {user?.first_name} {user?.last_name}
                  </ThemedText>
                  <ThemedText variant="secondary" style={styles.dateText}>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </ThemedText>
                </View>
                <Avatar.Text 
                  size={50} 
                  label={`${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`}
                  color="#FFF"
                  style={{
                    backgroundColor: Colors[theme].primary,
                  }}
                />
              </View>
            </ThemedView>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <ThemedView variant="card" useShadow style={styles.statCard}>
                <View style={styles.statContent}>
                  <View style={[styles.statIconContainer, { backgroundColor: Colors[theme].primary }]}>
                    <FontAwesome5 name="calendar-check" size={18} color="#FFF" />
                  </View>
                  <ThemedText type="heading">{dashboardData?.stats?.appointmentCount || 0}</ThemedText>
                  <ThemedText variant="secondary">Appointments</ThemedText>
                </View>
              </ThemedView>

              <ThemedView variant="card" useShadow style={styles.statCard}>
                <View style={styles.statContent}>
                  <View style={[styles.statIconContainer, { backgroundColor: Colors[theme].accent }]}>
                    <FontAwesome5 name="users" size={18} color="#FFF" />
                  </View>
                  <ThemedText type="heading">{dashboardData?.stats?.patientCount || 0}</ThemedText>
                  <ThemedText variant="secondary">Patients</ThemedText>
                </View>
              </ThemedView>

              <ThemedView variant="card" useShadow style={styles.statCard}>
                <View style={styles.statContent}>
                  <View style={[styles.statIconContainer, { backgroundColor: Colors[theme].success }]}>
                    <FontAwesome5 name="check-circle" size={18} color="#FFF" />
                  </View>
                  <ThemedText type="heading">{dashboardData?.stats?.completedAppointments || 0}</ThemedText>
                  <ThemedText variant="secondary">Completed</ThemedText>
                </View>
              </ThemedView>
            </View>

            {/* Today's Appointments Section */}
            <ThemedView variant="card" useShadow style={styles.appointmentsCard}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subheading">Today's Appointments</ThemedText>
                <TouchableRipple onPress={() => router.push('/(tabs)/appointments')}>
                  <ThemedText type="link" style={styles.viewAllLink}>View All</ThemedText>
                </TouchableRipple>
              </View>
              
              {todayAppointments && todayAppointments.length > 0 ? (
                todayAppointments.map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ThemedView 
                      variant="cardAlt"                      style={styles.appointmentItem}
                    >
                      <View style={styles.appointmentInfo}>
                          <View style={styles.appointmentTimeContainer}>
                            <ThemedText weight="semibold" style={styles.appointmentTime}>
                              {appointment.appointment_time || appointment.time || ''}
                            </ThemedText>
                          </View>
                          <View style={styles.appointmentDetails}>
                            <ThemedText weight="semibold">
                              {getPatientDisplayName(appointment)}
                            </ThemedText>
                            <ThemedText variant="tertiary" style={styles.appointmentType}>
                              {appointment.appointment_type || appointment.type || 'General'}
                            </ThemedText>                          </View>
                        </View>
                        <View style={styles.appointmentActions}>
                          <View style={[
                            styles.statusBadge, 
                            { backgroundColor: `${getStatusColor(appointment.status)}20` }
                          ]}>
                            <ThemedText
                              style={[styles.statusText, { color: getStatusColor(appointment.status) }]}
                            >
                              {appointment.status ? 
                                `${appointment.status.charAt(0).toUpperCase()}${appointment.status.slice(1)}` : 
                                ''
                              }
                            </ThemedText>
                          </View>
                          
                          {appointment.status === 'upcoming' && (
                            <TouchableRipple
                              style={[styles.consultButton, { backgroundColor: Colors[theme].success }]}
                              onPress={() => handleStartConsultation(appointment.id)}
                            >
                              <ThemedText style={styles.consultButtonText}>
                                Consult
                              </ThemedText>
                            </TouchableRipple>
                          )}
                        </View>
                    </ThemedView>
                    {index < todayAppointments.length - 1 && <Divider style={styles.divider} />}
                  </React.Fragment>
                ))
              ) : (
                <ThemedView variant="cardAlt" style={styles.emptyAppointments}>
                  <Ionicons
                    name="calendar-outline"
                    size={40}
                    color={Colors[theme].textTertiary}
                  />
                  <ThemedText variant="secondary" style={styles.emptyAppointmentsText}>
                    No appointments scheduled for today
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            
            {/* Quick Actions */}
            <ThemedView variant="card" useShadow style={styles.quickActionsCard}>
              <ThemedText type="subheading" style={styles.quickActionsTitle}>
                Quick Actions
              </ThemedText>
              
              <View style={styles.quickActionsGrid}>
                <TouchableRipple 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(tabs)/appointments')}
                >
                  <View style={styles.quickActionContent}>
                    <View style={[styles.quickActionIcon, { backgroundColor: Colors[theme].primary }]}>
                      <FontAwesome5 name="calendar-plus" size={18} color="#FFF" />
                    </View>
                    <ThemedText weight="medium" style={styles.quickActionText}>
                      Manage Appointments
                    </ThemedText>
                  </View>
                </TouchableRipple>
                
                <TouchableRipple 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(tabs)/patients')}
                >
                  <View style={styles.quickActionContent}>
                    <View style={[styles.quickActionIcon, { backgroundColor: Colors[theme].accent }]}>
                      <FontAwesome5 name="user-plus" size={18} color="#FFF" />
                    </View>
                    <ThemedText weight="medium" style={styles.quickActionText}>
                      Patient Records
                    </ThemedText>
                  </View>
                </TouchableRipple>
                
                <TouchableRipple 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(tabs)/profile')}
                >
                  <View style={styles.quickActionContent}>
                    <View style={[styles.quickActionIcon, { backgroundColor: Colors[theme].info }]}>
                      <FontAwesome5 name="user-md" size={18} color="#FFF" />
                    </View>
                    <ThemedText weight="medium" style={styles.quickActionText}>
                      Profile Settings
                    </ThemedText>
                  </View>
                </TouchableRipple>
              </View>
            </ThemedView>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0466C8',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  welcomeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  welcomeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeInfo: {
    flex: 1,
  },
  dateText: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
  },
  appointmentItem: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTimeContainer: {
    width: 60,
  },
  appointmentTime: {
    fontSize: 14,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 14,
    marginTop: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  consultButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  consultButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 8,
  },
  emptyAppointments: {
    alignItems: 'center',
    padding: 24,
    marginVertical: 8,
    borderRadius: 8,
  },
  emptyAppointmentsText: {
    marginTop: 12,
    textAlign: 'center',
  },
  quickActionsCard: {
    borderRadius: 12,
    padding: 16,
  },
  quickActionsTitle: {
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  quickActionButton: {
    flexBasis: '50%',
    padding: 8,
    maxWidth: '50%',
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
    fontSize: 14,
  },
});
