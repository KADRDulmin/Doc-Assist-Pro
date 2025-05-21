import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import appointmentService, { AppointmentData } from '@/src/services/appointment.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'missed'>('upcoming');
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  // Function to load appointments from API
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.getMyAppointments();
      if (response.success) {
        setAppointments(response.data);
      } else {
        setError(response.message || 'Failed to load appointments');
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err?.message || 'An error occurred while loading your appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Function to cancel an appointment
  const handleCancelAppointment = async (appointmentId: number) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await appointmentService.cancelAppointment(appointmentId);
              if (response.success) {
                // Update the local state with the cancelled appointment
                setAppointments(prevAppointments => 
                  prevAppointments.map(app => 
                    app.id === appointmentId 
                      ? { ...app, status: 'cancelled' } 
                      : app
                  )
                );
                Alert.alert('Success', 'Appointment cancelled successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel appointment');
              }
            } catch (err: any) {
              console.error('Error cancelling appointment:', err);
              Alert.alert('Error', err?.message || 'An error occurred while cancelling the appointment');
            }
          }
        }
      ]
    );
  };
  // Filter appointments based on active tab and date
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointment_date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    const isFutureAppointment = appointmentDate >= currentDate;

    switch (activeTab) {
      case 'upcoming':
        return isFutureAppointment && appointment.status === 'upcoming';
      case 'missed':
        return appointment.status === 'missed';
      default: // 'past'
        return appointment.status === 'completed' || appointment.status === 'cancelled';
    }
  });

  // Sort appointments by date
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.appointment_date);
    const dateB = new Date(b.appointment_date);
    return activeTab === 'upcoming' 
      ? dateA.getTime() - dateB.getTime()  // Show nearest first for upcoming
      : dateB.getTime() - dateA.getTime(); // Show most recent first for others
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (appointmentDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return appointmentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;
  
  // Define modern UI colors
  const primaryColor = colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#F5F7FA';
  const cardBackground = colorScheme === 'dark' ? '#1D2939' : '#FFFFFF';
  const borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const shadowColor = colorScheme === 'dark' ? '#000' : '#2C3E50';
  
  // Status colors
  const statusColors = {
    upcoming: { 
      primary: '#4CAF50', 
      bg: colorScheme === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
      gradient: ['#4CAF50', '#388E3C']
    },
    completed: { 
      primary: '#2196F3', 
      bg: colorScheme === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
      gradient: ['#2196F3', '#1976D2'] 
    },
    missed: { 
      primary: '#FF9800', 
      bg: colorScheme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
      gradient: ['#FF9800', '#F57C00'] 
    },
    cancelled: { 
      primary: '#FF5252', 
      bg: colorScheme === 'dark' ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 82, 82, 0.1)',
      gradient: ['#FF5252', '#D32F2F'] 
    }
  };
  
  // Get safe colors for text
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const renderAppointmentItem = ({ item }: { item: AppointmentData }) => {
    // Get appropriate status color
    const statusColor = 
      item.status === 'upcoming' ? statusColors.upcoming :
      item.status === 'completed' ? statusColors.completed :
      item.status === 'missed' ? statusColors.missed : 
      statusColors.cancelled;
    
    return (
      <TouchableOpacity 
        style={[styles.appointmentCard, {
          backgroundColor: cardBackground,
          borderColor: borderColor,
          shadowColor: shadowColor,
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.1,
          shadowRadius: 6,
          elevation: 5
        }]}
        onPress={() => router.push(`/appointments/${item.id}`)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[statusColor.bg + '80', statusColor.bg + '00']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.cardGradientOverlay}
        />
        
        <View style={styles.appointmentCardHeader}>
          <View style={styles.statusContainer}>
            <LinearGradient
              colors={statusColor.gradient}
              style={styles.statusBadge}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Ionicons 
                name={
                  item.status === 'upcoming' ? 'time-outline' : 
                  item.status === 'completed' ? 'checkmark-circle-outline' :
                  item.status === 'missed' ? 'alert-circle-outline' : 'close-circle-outline'
                } 
                size={12} 
                color="#fff"
                style={{marginRight: 4}} 
              />
              <ThemedText style={styles.statusText}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </ThemedText>
            </LinearGradient>
          </View>
          
          <View style={styles.appointmentCardDate}>
            <ThemedText style={styles.appointmentDateText}>{formatDate(item.appointment_date)}</ThemedText>
            <ThemedText style={styles.appointmentTimeText}>{formatTime(item.appointment_time)}</ThemedText>
          </View>
        </View>
        
        <View style={styles.appointmentCardBody}>
          <View style={styles.doctorInfoSection}>
            <View style={styles.doctorAvatarContainer}>
              <LinearGradient
                colors={[primaryColor, colorScheme === 'dark' ? '#144272' : '#78b1c4']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.doctorAvatarGradient}
              >
                <Ionicons name="person" size={24} color="#fff" />
              </LinearGradient>
            </View>
            
            <View style={styles.appointmentDetails}>
              <ThemedText style={styles.doctorName}>
                {item.doctor ? `Dr. ${item.doctor.user.first_name} ${item.doctor.user.last_name}` : 'Doctor'}
              </ThemedText>
              <ThemedText style={styles.doctorSpecialty}>
                {item.doctor?.specialization || 'Specialist'}
              </ThemedText>
            </View>
          </View>
          
          {item.location && (
            <View style={styles.locationContainer}>
              <View style={[styles.iconContainer, {backgroundColor: statusColor.bg}]}>
                <Ionicons name="location" size={14} color={statusColor.primary} />
              </View>
              <ThemedText style={styles.locationText}>{item.location}</ThemedText>
            </View>
          )}
        </View>
        
        <View style={[styles.appointmentCardFooter, {borderTopColor: borderColor}]}>
          {item.status === 'upcoming' && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={() => router.push(`/appointments/${item.id}/reschedule`)}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.actionButton}
                >
                  <Ionicons name="calendar" size={16} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>Reschedule</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleCancelAppointment(item.id)}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#FF5252', '#D32F2F']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.actionButton}
                >
                  <Ionicons name="close-circle" size={16} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>Cancel</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          
          {item.status === 'completed' && (
            <TouchableOpacity 
              style={styles.fullWidthButtonWrapper}
              onPress={() => router.push(`/feedback/${item.id}`)}
            >
              <LinearGradient
                colors={['#FFC107', '#FFA000']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.fullWidthActionButton}
              >
                <Ionicons name="star" size={16} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Leave Feedback</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {item.status === 'missed' && (
            <TouchableOpacity 
              style={styles.fullWidthButtonWrapper}
              onPress={() => router.push(`/appointments/${item.id}/reschedule`)}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.fullWidthActionButton}
              >
                <Ionicons name="calendar" size={16} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Reschedule</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, {backgroundColor}]}>
        <View style={styles.emptyIconContainer}>
          <LinearGradient
            colors={colorScheme === 'dark' ? 
              ['rgba(161, 206, 220, 0.15)', 'rgba(161, 206, 220, 0.05)'] : 
              ['rgba(10, 126, 164, 0.1)', 'rgba(10, 126, 164, 0.03)']
            }
            style={styles.emptyGradient}
          >
            <ActivityIndicator size="large" color={primaryColor} />
          </LinearGradient>
        </View>
        <ThemedText style={styles.emptyTitle}>Loading Appointments</ThemedText>
        <ThemedText style={styles.loadingText}>Please wait while we fetch your appointments...</ThemedText>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, {backgroundColor}]}>
        <View style={styles.emptyIconContainer}>
          <LinearGradient
            colors={['rgba(255, 82, 82, 0.15)', 'rgba(255, 82, 82, 0.05)']}
            style={styles.emptyGradient}
          >
            <Ionicons name="alert-circle" size={60} color="#e53935" />
          </LinearGradient>
        </View>
        <ThemedText style={[styles.emptyTitle, {marginBottom: 12}]}>Oops! Something went wrong</ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.scheduleButtonWrapper}
          onPress={loadAppointments}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#1D3D47', '#0f1e23'] : ['#0a7ea4', '#055976']} 
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.scheduleButton}
          >
            <Ionicons name="refresh" size={18} color="#fff" style={{marginRight: 8}} />
            <ThemedText style={styles.scheduleButtonText}>Try Again</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      {/* Header */}
      <LinearGradient
        colors={colorScheme === 'dark' ? headerGradientDark : headerGradientLight}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
      >
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.headerTitle}>My Appointments</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {sortedAppointments.length} 
              {activeTab === 'upcoming' ? ' upcoming' : 
               activeTab === 'missed' ? ' missed' : ' past'} appointments
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={styles.newButton}
            onPress={() => router.push('/new-appointment')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.newButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Modern Tab Selector */}
        <View style={styles.tabSelectorContainer}>
          <View style={styles.tabSelector}>
            <View style={styles.tabIndicatorContainer}>
              <Animated.View 
                style={[
                  styles.tabIndicator, 
                  {
                    left: activeTab === 'upcoming' ? '5%' : 
                         activeTab === 'missed' ? '38%' : '71%'
                  }
                ]} 
              />
            </View>
            
            {/* Tab buttons */}
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('upcoming')}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={activeTab === 'upcoming' ? "#fff" : "rgba(255,255,255,0.6)"} 
                />
                <ThemedText 
                  style={[
                    styles.tabText, 
                    activeTab === 'upcoming' && styles.activeTabText
                  ]}
                >
                  Upcoming
                </ThemedText>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('missed')}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name="alert-circle-outline" 
                  size={16} 
                  color={activeTab === 'missed' ? "#fff" : "rgba(255,255,255,0.6)"} 
                />
                <ThemedText 
                  style={[
                    styles.tabText, 
                    activeTab === 'missed' && styles.activeTabText
                  ]}
                >
                  Missed
                </ThemedText>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('past')}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name="checkmark-done-outline" 
                  size={16} 
                  color={activeTab === 'past' ? "#fff" : "rgba(255,255,255,0.6)"} 
                />
                <ThemedText 
                  style={[
                    styles.tabText, 
                    activeTab === 'past' && styles.activeTabText
                  ]}
                >
                  Past
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={sortedAppointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4']}
            tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'}
          />
        }        ListEmptyComponent={
          <ThemedView style={[styles.emptyContainer, {backgroundColor}]}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={colorScheme === 'dark' ? 
                  ['rgba(161, 206, 220, 0.15)', 'rgba(161, 206, 220, 0.05)'] : 
                  ['rgba(10, 126, 164, 0.1)', 'rgba(10, 126, 164, 0.03)']
                }
                style={styles.emptyGradient}
              >
                <Ionicons 
                  name={
                    activeTab === 'upcoming' ? 'calendar-outline' : 
                    activeTab === 'missed' ? 'alert-circle-outline' : 'checkmark-done-outline'
                  }
                  size={60} 
                  color={primaryColor} 
                  style={{ opacity: 0.8 }} 
                />
              </LinearGradient>
            </View>
            
            <ThemedText style={styles.emptyTitle}>
              No {activeTab === 'upcoming' ? 'Upcoming' : activeTab === 'missed' ? 'Missed' : 'Past'} Appointments
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              {activeTab === 'upcoming' ? 'You have no upcoming appointments scheduled.' : 
               activeTab === 'missed' ? 'You have no missed appointments.' : 
               'You have no past appointments.'}
            </ThemedText>
            
            {(activeTab === 'upcoming' || activeTab === 'missed') && (
              <TouchableOpacity 
                style={styles.scheduleButtonWrapper}
                onPress={() => router.push('/new-appointment')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={colorScheme === 'dark' ? ['#1D3D47', '#0f1e23'] : ['#0a7ea4', '#055976']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.scheduleButton}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" style={{marginRight: 8}} />
                  <ThemedText style={styles.scheduleButtonText}>Schedule New Appointment</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ThemedView>
        }
      />
      
      {/* Bottom spacing for bottom tabs */}
      <View style={{ height: 70 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Header styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14, 
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  newButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  newButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  
  // Modern Tab Selector
  tabSelectorContainer: {
    paddingHorizontal: 20,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    padding: 4,
    position: 'relative',
    height: 44,
  },
  tabIndicatorContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
  },
  tabIndicator: {
    position: 'absolute',
    width: '28%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  
  // List container
  listContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  
  // Appointment Card
  appointmentCard: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 0,
  },
  appointmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  statusContainer: {
    zIndex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentCardDate: {
    alignItems: 'flex-end',
  },
  appointmentDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentTimeText: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.7,
  },
  
  // Appointment body
  appointmentCardBody: {
    padding: 16,
  },
  doctorInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorAvatarContainer: {
    marginRight: 15,
  },
  doctorAvatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    opacity: 0.7,
  },
  
  // Location
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 4,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  
  // Button Footer
  appointmentCardFooter: {
    borderTopWidth: 1,
    padding: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 30,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  fullWidthButtonWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  fullWidthActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 24,
    borderRadius: 60,
    overflow: 'hidden',
  },
  emptyGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  scheduleButtonWrapper: {
    marginTop: 24,
    width: '100%',
    maxWidth: 300,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});