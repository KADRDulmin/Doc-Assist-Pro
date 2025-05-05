import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, View, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Searchbar, Divider, TouchableRipple, FAB, Badge } from 'react-native-paper';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import doctorService, { AppointmentData } from '../../services/doctorService';
import Colors from '../../constants/Colors';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import ModernHeader from '../../components/ui/ModernHeader';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  
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

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      const response = await doctorService.getAppointments(
        token, 
        user?.id, 
        selectedFilter || undefined
      );
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} appointments successfully`);
        
        // For completed appointments, fetch feedback data
        const appointmentsWithFeedback = await Promise.all(
          response.data.map(async (appointment) => {
            if (appointment.status === 'completed') {
              try {
                // Fetch feedback for this appointment
                const feedbackResponse = await doctorService.getFeedbackByAppointment(
                  appointment.id, 
                  token
                );
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
  }, [user?.id, selectedFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    // Apply search filter whenever the search query changes
    if (searchQuery.trim() === '') {
      setFilteredAppointments(appointments);
      return;
    }
    
    const searchTerms = searchQuery.toLowerCase().trim().split(' ');
    const filtered = appointments.filter(appointment => {
      const patientName = appointment.patient?.name?.toLowerCase() || '';
      const appointmentDate = appointment.appointment_date?.toLowerCase() || '';
      const appointmentTime = appointment.appointment_time?.toLowerCase() || '';
      const appointmentType = (appointment.appointment_type || '').toLowerCase();
      
      return searchTerms.some(term => 
        patientName.includes(term) || 
        appointmentDate.includes(term) || 
        appointmentTime.includes(term) || 
        appointmentType.includes(term)
      );
    });
    
    setFilteredAppointments(filtered);
  }, [searchQuery, appointments]);

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    loadAppointments();
  };

  const filterAppointments = (status: string | null) => {
    setSelectedFilter(status);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

  const handleStartConsultation = (appointmentId: number) => {
    router.push(`/consultation/${appointmentId}` as any);
  };

  const formatDateString = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (err) {
      return dateString; // fallback to original string if parsing fails
    }
  };

  const renderAppointmentCard = ({ item }: { item: AppointmentData }) => {
    const isUpcoming = item.status === 'upcoming';
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isMissed = item.status === 'missed';
    
    const getStatusColor = () => {
      switch (item.status) {
        case 'upcoming':
          return Colors[theme].primary;
        case 'completed':
          return Colors[theme].success;
        case 'cancelled':
          return Colors[theme].danger;
        case 'missed':
          return Colors[theme].warning;
        default:
          return Colors[theme].textTertiary;
      }
    };

    const getStatusIcon = () => {
      switch (item.status) {
        case 'upcoming':
          return 'calendar-check';
        case 'completed':
          return 'check-circle';
        case 'cancelled':
          return 'times-circle';
        case 'missed':
          return 'exclamation-circle';
        default:
          return 'question-circle';
      }
    };
    
    return (
      <TouchableRipple onPress={() => showAppointmentDialog(item)}>
        <ThemedView 
          variant="card" 
          useShadow 
          style={styles.appointmentCard}
        >
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor() }
          ]} />

          <View style={styles.appointmentHeader}>
            <View style={styles.dateTimeContainer}>
              <View style={[
                styles.dateContainer, 
                { backgroundColor: `${getStatusColor()}15` }
              ]}>
                <ThemedText weight="semibold" style={styles.dateText}>
                  {new Date(item.appointment_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </ThemedText>
              </View>
              
              <ThemedText variant="secondary" style={styles.timeText}>
                {item.appointment_time}
              </ThemedText>
            </View>
            
            <View style={styles.patientInfo}>
              <ThemedText weight="semibold" style={styles.patientName}>
                {item.patient?.name || 'Unknown Patient'}
              </ThemedText>
              
              <View style={styles.typeAndStatusContainer}>
                {item.appointment_type && (
                  <View style={styles.appointmentTypeContainer}>
                    <FontAwesome5 
                      name="stethoscope" 
                      size={12} 
                      color={Colors[theme].primary}
                      style={styles.typeIcon} 
                    />
                    <ThemedText variant="tertiary" style={styles.appointmentType}>
                      {item.appointment_type}
                    </ThemedText>
                  </View>
                )}
                
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: `${getStatusColor()}20` }
                ]}>
                  <FontAwesome5 
                    name={getStatusIcon()} 
                    size={10} 
                    color={getStatusColor()}
                    style={styles.statusIcon} 
                  />
                  <ThemedText
                    style={[styles.statusText, { color: getStatusColor() }]}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
          
          {item.notes && (
            <View style={styles.notesSection}>
              <ThemedText variant="secondary" numberOfLines={2} style={styles.notesText}>
                <FontAwesome5 
                  name="sticky-note" 
                  size={12} 
                  color={Colors[theme].textSecondary}
                  style={styles.notesIcon} 
                /> {item.notes}
              </ThemedText>
            </View>
          )}
          
          {/* Show feedback stars if available */}
          {item.feedback && (
            <View style={styles.feedbackContainer}>
              <ThemedText variant="secondary" style={styles.feedbackLabel}>
                Feedback:
              </ThemedText>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <MaterialIcons 
                    key={star}
                    name={star <= item.feedback!.rating ? "star" : "star-border"} 
                    size={16} 
                    color="#FFD700" 
                    style={{ marginHorizontal: 1 }}
                  />
                ))}
              </View>
            </View>
          )}
          
          {isUpcoming && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleStartConsultation(item.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors[theme].primary === Colors.light.primary 
                    ? ['#0466C8', '#0353A4'] 
                    : ['#58B0ED', '#0466C8']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name="stethoscope" size={14} color="#FFF" />
                  <ThemedText style={styles.actionButtonText}>Start Consultation</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>
      </TouchableRipple>
    );
  };

  const renderAppointmentDialog = () => {
    if (!selectedAppointment) return null;
    
    const appointment = selectedAppointment;
    const isUpcoming = appointment.status === 'upcoming';
    
    return (
      <ThemedView variant="overlay" style={styles.modalOverlay}>
        <ThemedView variant="card" style={styles.appointmentDetailCard}>
          <View style={styles.detailHeader}>
            <ThemedText type="heading">Appointment Details</ThemedText>
            <TouchableOpacity onPress={hideDialog} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color={Colors[theme].text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detailScrollContent}>
            <View style={styles.detailContent}>
              <View style={[
                styles.statusDetailContainer,
                { backgroundColor: `${getStatusColor(appointment.status)}15` }
              ]}>
                <LinearGradient
                  colors={getStatusGradient(appointment.status)}
                  style={styles.statusIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 
                    name={getStatusIcon(appointment.status)} 
                    size={16} 
                    color="#FFF" 
                  />
                </LinearGradient>
                <ThemedText 
                  weight="semibold"
                  style={[styles.statusDetailText, { color: getStatusColor(appointment.status) }]}
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </ThemedText>
              </View>
              
              <ThemedView variant="cardAlt" style={styles.patientDetailCard}>
                <View style={styles.patientInfoHeader}>
                  <View style={styles.patientAvatarContainer}>
                    <LinearGradient
                      colors={['#0466C8', '#0353A4']}
                      style={styles.patientAvatar}
                    >
                      <ThemedText style={styles.patientInitials}>
                        {getPatientInitials(appointment.patient?.name || '')}
                      </ThemedText>
                    </LinearGradient>
                  </View>
                  <View style={styles.patientTextInfo}>
                    <ThemedText weight="semibold" style={styles.patientDetailName}>
                      {appointment.patient?.name || 'Unknown Patient'}
                    </ThemedText>
                    {appointment.patient?.age && (
                      <ThemedText variant="tertiary">
                        {calculateAge(appointment.patient.age)} years old
                      </ThemedText>
                    )}
                  </View>
                </View>
              </ThemedView>
              
              <ThemedView variant="cardAlt" style={styles.detailInfoCard}>
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <FontAwesome5 name="calendar-alt" size={16} color={Colors[theme].primary} />
                    <ThemedText variant="secondary" style={styles.detailLabel}>Date:</ThemedText>
                  </View>
                  <ThemedText style={styles.detailValue}>
                    {formatDateString(appointment.appointment_date)}
                  </ThemedText>
                </View>
                
                <Divider style={styles.detailDivider} />
                
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <FontAwesome5 name="clock" size={16} color={Colors[theme].primary} />
                    <ThemedText variant="secondary" style={styles.detailLabel}>Time:</ThemedText>
                  </View>
                  <ThemedText style={styles.detailValue}>
                    {appointment.appointment_time}
                  </ThemedText>
                </View>
                
                <Divider style={styles.detailDivider} />
                
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <FontAwesome5 name="tag" size={16} color={Colors[theme].primary} />
                    <ThemedText variant="secondary" style={styles.detailLabel}>Type:</ThemedText>
                  </View>
                  <ThemedText style={styles.detailValue}>
                    {appointment.appointment_type || 'General Consultation'}
                  </ThemedText>
                </View>
                
                {appointment.location && (
                  <>
                    <Divider style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <View style={styles.detailLabelContainer}>
                        <FontAwesome5 name="map-marker-alt" size={16} color={Colors[theme].primary} />
                        <ThemedText variant="secondary" style={styles.detailLabel}>Location:</ThemedText>
                      </View>
                      <ThemedText style={styles.detailValue}>
                        {appointment.location}
                      </ThemedText>
                    </View>
                  </>
                )}
              </ThemedView>
              
              {appointment.notes && (
                <ThemedView variant="cardAlt" style={styles.notesDetailContainer}>
                  <View style={styles.sectionHeaderContainer}>
                    <FontAwesome5 name="sticky-note" size={16} color={Colors[theme].primary} />
                    <ThemedText variant="secondary" weight="semibold" style={styles.sectionHeaderText}>
                      Notes
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.notesDetailText}>
                    {appointment.notes}
                  </ThemedText>
                </ThemedView>
              )}
              
              {/* Patient Symptoms and Analysis Section - Show if available */}
              {appointment.symptoms && (
                <ThemedView variant="cardAlt" style={styles.symptomContainer}>
                  <View style={styles.sectionHeaderContainer}>
                    <FontAwesome5 name="heartbeat" size={16} color={Colors[theme].primary} />
                    <ThemedText variant="secondary" weight="semibold" style={styles.sectionHeaderText}>
                      Patient Symptoms
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.symptomText}>
                    {appointment.symptoms}
                  </ThemedText>
                  
                  {appointment.criticality && (
                    <View style={[
                      styles.criticalityContainer,
                      { 
                        backgroundColor: getCriticalityColor(appointment.criticality) + '20',
                        borderColor: getCriticalityColor(appointment.criticality) + '40'
                      }
                    ]}>
                      <FontAwesome5 
                        name={getCriticalityIcon(appointment.criticality)} 
                        size={14}
                        color={getCriticalityColor(appointment.criticality)} 
                        style={styles.criticalityIcon}
                      />
                      <ThemedText 
                        style={[
                          styles.criticalityText,
                          { color: getCriticalityColor(appointment.criticality) }
                        ]}
                        weight="semibold"
                      >
                        {appointment.criticality} Criticality
                      </ThemedText>
                    </View>
                  )}
                  
                  {(appointment.possible_illness_1 || appointment.possible_illness_2) && (
                    <View style={styles.possibleDiagnosisContainer}>
                      <ThemedText variant="secondary" weight="semibold" style={styles.diagnosisLabel}>
                        Possible Diagnosis:
                      </ThemedText>
                      <View style={styles.diagnosisBadgesContainer}>
                        {[appointment.possible_illness_1, appointment.possible_illness_2]
                          .filter(Boolean)
                          .map((illness, index) => (
                            <View 
                              key={index} 
                              style={[
                                styles.diagnosisBadge,
                                { backgroundColor: Colors[theme].primary + '15' }
                              ]}
                            >
                              <ThemedText style={styles.diagnosisText}>
                                {illness}
                              </ThemedText>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}
                </ThemedView>
              )}
              
              {/* Patient Feedback Section */}
              {appointment.feedback && (
                <ThemedView variant="cardAlt" style={styles.feedbackDetailContainer}>
                  <View style={styles.sectionHeaderContainer}>
                    <FontAwesome5 name="star" size={16} color={Colors[theme].primary} />
                    <ThemedText variant="secondary" weight="semibold" style={styles.sectionHeaderText}>
                      Patient Feedback
                    </ThemedText>
                  </View>
                  
                  <View style={styles.ratingDetailContainer}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <MaterialIcons 
                        key={star}
                        name={star <= appointment.feedback!.rating ? "star" : "star-border"} 
                        size={22} 
                        color="#FFD700" 
                        style={{ marginRight: 2 }}
                      />
                    ))}
                    <ThemedText style={styles.ratingText}>
                      ({appointment.feedback.rating}/5)
                    </ThemedText>
                  </View>
                  
                  {appointment.feedback.comment && (
                    <ThemedText style={styles.feedbackComment}>
                      "{appointment.feedback.comment}"
                    </ThemedText>
                  )}
                </ThemedView>
              )}
              
              {isUpcoming && (
                <View style={styles.detailActionContainer}>
                  <TouchableOpacity
                    style={styles.detailActionButtonCancel}
                    onPress={() => updateAppointmentStatus('cancelled')}
                    disabled={statusUpdateLoading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <FontAwesome5 name="times-circle" size={16} color={Colors[theme].danger} />
                      <ThemedText style={[styles.outlineButtonText, { color: Colors[theme].danger }]}>
                        Cancel Appointment
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.detailActionButtonConsult}
                    onPress={() => handleStartConsultation(appointment.id)}
                    disabled={statusUpdateLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={Colors[theme].primary === Colors.light.primary 
                        ? ['#0466C8', '#0353A4'] 
                        : ['#58B0ED', '#0466C8']}
                      style={styles.actionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <FontAwesome5 name="stethoscope" size={16} color="#FFF" />
                      <ThemedText style={styles.actionButtonText}>Start Consultation</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </ThemedView>
      </ThemedView>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return Colors[theme].primary;
      case 'completed':
        return Colors[theme].success;
      case 'cancelled':
        return Colors[theme].danger;
      case 'missed':
        return Colors[theme].warning;
      default:
        return Colors[theme].textTertiary;
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'upcoming':
        return Colors[theme].primary === Colors.light.primary 
          ? ['#0466C8', '#0353A4'] 
          : ['#58B0ED', '#0466C8'];
      case 'completed':
        return ['#28a745', '#218838'];
      case 'cancelled':
        return ['#dc3545', '#c82333'];
      case 'missed':
        return ['#ffc107', '#e0a800'];
      default:
        return ['#6c757d', '#5a6268'];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'calendar-check';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'times-circle';
      case 'missed':
        return 'exclamation-circle';
      default:
        return 'question-circle';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality.toLowerCase()) {
      case 'high':
      case 'emergency':
        return Colors[theme].danger;
      case 'medium':
        return Colors[theme].warning;
      default:
        return Colors[theme].success;
    }
  };

  const getCriticalityIcon = (criticality: string) => {
    switch (criticality.toLowerCase()) {
      case 'high':
      case 'emergency':
        return 'exclamation-triangle';
      case 'medium':
        return 'exclamation-circle';
      default:
        return 'check-circle';
    }
  };

  const getPatientInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const calculateAge = (birthDateString: string) => {
    try {
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (err) {
      return '?';
    }
  };

  const renderFilterChips = () => {
    const filters = [
      { label: 'All', value: null, icon: 'calendar-alt' },
      { label: 'Upcoming', value: 'upcoming', icon: 'calendar-check' },
      { label: 'Completed', value: 'completed', icon: 'check-circle' },
      { label: 'Cancelled', value: 'cancelled', icon: 'times-circle' },
      { label: 'Missed', value: 'missed', icon: 'exclamation-circle' },
    ];
    
    return (
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterChipsContainer}
        >
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.value;
            const iconColor = isSelected ? '#FFF' : Colors[theme].primary;
            const textColor = isSelected ? '#FFF' : Colors[theme].text;
            
            return (
              <TouchableOpacity
                key={filter.label}
                onPress={() => filterAppointments(filter.value)}
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  isSelected && { 
                    borderColor: Colors[theme].primary,
                    overflow: 'hidden'
                  }
                ]}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={Colors[theme].primary === Colors.light.primary 
                      ? ['#0466C8', '#0353A4'] 
                      : ['#58B0ED', '#0466C8']}
                    style={styles.filterChipGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <FontAwesome5 name={filter.icon} size={14} color={iconColor} style={styles.filterChipIcon} />
                    <ThemedText
                      weight="semibold"
                      style={[styles.filterChipText, { color: textColor }]}
                    >
                      {filter.label}
                    </ThemedText>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterChipContent}>
                    <FontAwesome5 name={filter.icon} size={14} color={iconColor} style={styles.filterChipIcon} />
                    <ThemedText
                      style={styles.filterChipText}
                    >
                      {filter.label}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <ThemedView variant="secondary" style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ModernHeader 
        title="My Appointments"
        showBackButton={false}
        userName={`Dr. ${user?.last_name || 'Smith'}`}
      />
      
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Search appointments"
          onChangeText={handleSearch}
          value={searchQuery}
          style={[
            styles.searchbar,
            { backgroundColor: Colors[theme].card }
          ]}
          iconColor={Colors[theme].icon}
          inputStyle={{ color: Colors[theme].text }}
          placeholderTextColor={Colors[theme].textTertiary}
          clearButtonMode="while-editing"
        />
      </View>
      
      {renderFilterChips()}
      
      {error ? (
        <ThemedView variant="card" useShadow style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={40} color={Colors[theme].danger} />
          <ThemedText type="error" style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadAppointments}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors[theme].primary === Colors.light.primary 
                ? ['#0466C8', '#0353A4'] 
                : ['#58B0ED', '#0466C8']}
              style={styles.retryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="sync" size={14} color="#FFF" style={styles.retryIcon} />
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ThemedView>
      ) : loading && !refreshing ? (
        <ThemedView variant="card" useShadow style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[theme].primary} style={styles.loadingIndicator} />
          <FontAwesome5 name="calendar-alt" size={40} color={Colors[theme].primary} style={styles.loadingIcon} />
          <ThemedText variant="secondary" style={styles.loadingText}>
            Loading appointments...
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[Colors[theme].primary]}
              tintColor={Colors[theme].primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <ThemedView variant="card" useShadow style={styles.emptyContainer}>
              <FontAwesome5 
                name="calendar-times" 
                size={50} 
                color={Colors[theme].textTertiary} 
              />
              <ThemedText variant="secondary" style={styles.emptyText}>
                {searchQuery 
                  ? 'No appointments match your search' 
                  : selectedFilter
                    ? `No ${selectedFilter} appointments found`
                    : 'No appointments found'
                }
              </ThemedText>
              <TouchableOpacity 
                style={styles.newAppointmentButton}
                onPress={() => console.log('Schedule new appointment')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors[theme].primary === Colors.light.primary 
                    ? ['#0466C8', '#0353A4'] 
                    : ['#58B0ED', '#0466C8']}
                  style={styles.newAppointmentGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name="calendar-plus" size={14} color="#FFF" />
                  <ThemedText style={styles.actionButtonText}>Schedule New Appointment</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </ThemedView>
          }
        />
      )}
      
      {dialogVisible && renderAppointmentDialog()}
      
      <FAB
        style={[styles.fab]}
        icon={() => (
          <LinearGradient
            colors={Colors[theme].primary === Colors.light.primary 
              ? ['#0466C8', '#0353A4'] 
              : ['#58B0ED', '#0466C8']}
            style={styles.fabGradient}
          >
            <FontAwesome5 name="calendar-plus" size={20} color="#FFF" />
          </LinearGradient>
        )}
        label="Schedule"
        onPress={() => console.log('Schedule new appointment')}
        color="#FFF"
      />
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterChip: {
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  filterChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterChipIcon: {
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 16,
    padding: 24,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // For FAB space
  },
  appointmentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateTimeContainer: {
    alignItems: 'center',
  },
  dateContainer: {
    width: 72,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 13,
  },
  patientInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  patientName: {
    fontSize: 16,
    marginBottom: 6,
  },
  typeAndStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  appointmentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  typeIcon: {
    marginRight: 4,
  },
  appointmentType: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  notesIcon: {
    marginRight: 6,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  feedbackLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  actionButtonsContainer: {
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  outlineButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  newAppointmentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  newAppointmentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  appointmentDetailCard: {
    width: width * 0.9,
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0,
    zIndex: 1001,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  closeButton: {
    padding: 8,
  },
  detailScrollContent: {
    maxHeight: '100%',
  },
  detailContent: {
    padding: 16,
  },
  statusDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginLeft: 6,
  },
  statusDetailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  patientDetailCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  patientInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatarContainer: {
    marginRight: 16,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientTextInfo: {
    flex: 1,
  },
  patientDetailName: {
    fontSize: 16,
    marginBottom: 4,
  },
  detailInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  detailLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderText: {
    marginLeft: 8,
    fontSize: 16,
  },
  notesDetailContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesDetailText: {
    lineHeight: 20,
  },
  symptomContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  symptomText: {
    marginBottom: 16,
    lineHeight: 20,
  },
  criticalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  criticalityIcon: {
    marginRight: 8,
  },
  criticalityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  possibleDiagnosisContainer: {
    marginBottom: 8,
  },
  diagnosisLabel: {
    marginBottom: 8,
  },
  diagnosisBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  diagnosisBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  diagnosisText: {
    fontSize: 14,
  },
  feedbackDetailContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  ratingDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 6,
  },
  feedbackComment: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
  detailActionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  detailActionButtonCancel: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'red',
    overflow: 'hidden',
  },
  detailActionButtonConsult: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});