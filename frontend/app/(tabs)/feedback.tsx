import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Platform,
  SafeAreaView,
  Alert,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import feedbackService, { FeedbackData, NewFeedback } from '@/src/services/feedback.service';
import appointmentService from '@/src/services/appointment.service';
import { useAuth } from '@/src/hooks/useAuth';

const windowWidth = Dimensions.get('window').width;

// Interface definitions
interface DoctorFeedback {
  id: number;
  doctorId: number;
  doctorName: string;
  specialty: string;
  appointmentDate: string;
  rating: number;
  comment: string;
  date: string;
  imageUrl?: string;
}

interface PendingFeedback {
  id: number;
  doctorId: number;
  doctorName: string;
  specialty: string;
  appointmentDate: string;
  appointmentType: string;
  imageUrl?: string;
}

export default function FeedbackScreen() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [currentFeedbackDoctor, setCurrentFeedbackDoctor] = useState<PendingFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real data from API
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<DoctorFeedback[]>([]);
  const [pendingFeedbacks, setPendingFeedbacks] = useState<PendingFeedback[]>([]);

  // Fetch feedback data when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadFeedbackData();
    }
  }, [isAuthenticated]);
  // Function to load feedback data from API
  const loadFeedbackData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get feedback submitted by the user
      const myFeedbackResponse = await feedbackService.getMyFeedback();
      
      if (myFeedbackResponse.success && myFeedbackResponse.data) {
        // Transform API data to match our UI structure
        const submittedData = myFeedbackResponse.data.map(feedback => ({
          id: feedback.id,
          doctorId: feedback.doctor_id,
          doctorName: feedback.doctor?.user.first_name + ' ' + feedback.doctor?.user.last_name,
          specialty: feedback.doctor?.specialization || 'Doctor',
          appointmentDate: new Date(feedback.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          rating: feedback.rating,
          comment: feedback.comment || '',
          date: new Date(feedback.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
        }));
        
        setSubmittedFeedbacks(submittedData);
      }
      
      // Get completed appointments to find ones that need feedback
      // In a real app, we should have an endpoint to get appointments without feedback
      // For now we're getting all completed appointments and filtering on the client side
      const completedAppointmentsResponse = await appointmentService.getCompletedAppointments();
      
      if (completedAppointmentsResponse.success && completedAppointmentsResponse.data) {
        // Get IDs of appointments that already have feedback
        const feedbackAppointmentIds = myFeedbackResponse.success && myFeedbackResponse.data ? 
          myFeedbackResponse.data.map(feedback => feedback.appointment_id) : [];
        
        // Filter appointments that don't have feedback yet
        const appointmentsNeedingFeedback = completedAppointmentsResponse.data.filter(appointment => 
          !feedbackAppointmentIds.includes(appointment.id)
        );
        
        // Transform to match our UI structure
        const pendingData = appointmentsNeedingFeedback.map(appointment => ({
          id: appointment.id,
          doctorId: appointment.doctor_id,
          doctorName: appointment.doctor?.user.first_name + ' ' + appointment.doctor?.user.last_name,
          specialty: appointment.doctor?.specialization || 'Doctor',
          appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          appointmentType: appointment.appointment_type,
          imageUrl: appointment.doctor?.profile_image_url,
        }));
        
        setPendingFeedbacks(pendingData);
      }
    } catch (err) {
      console.error('Error loading feedback data:', err);
      setError('Failed to load feedback data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const openFeedbackForm = (doctor: PendingFeedback) => {
    setCurrentFeedbackDoctor(doctor);
    setRating(0);
    setFeedbackText('');
  };

  const closeFeedbackForm = () => {
    setCurrentFeedbackDoctor(null);
    setRating(0);
    setFeedbackText('');
  };

  const submitFeedback = async () => {
    if (!currentFeedbackDoctor) return;
    
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating for the doctor.');
      return;
    }
    
    try {      // Create feedback data for API
      const feedbackData: NewFeedback = {
        doctor_id: currentFeedbackDoctor.doctorId,
        appointment_id: currentFeedbackDoctor.id,
        rating,
        comment: feedbackText,
      };
      
      // Submit feedback to API
      const response = await feedbackService.submitFeedback(feedbackData);
      
      if (response.success) {
        // Add the new feedback to the submitted list
        const newFeedback: DoctorFeedback = {
          id: response.data.id,
          doctorId: response.data.doctor_id,
          doctorName: currentFeedbackDoctor.doctorName,
          specialty: currentFeedbackDoctor.specialty,
          appointmentDate: currentFeedbackDoctor.appointmentDate,
          rating,
          comment: feedbackText,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
        };
        
        // Update the submitted feedbacks list
        setSubmittedFeedbacks([newFeedback, ...submittedFeedbacks]);
        
        // Remove from pending feedbacks
        setPendingFeedbacks(pendingFeedbacks.filter(pf => pf.id !== currentFeedbackDoctor.id));
        
        // Close form
        closeFeedbackForm();
        
        Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
      } else {
        Alert.alert('Error', response.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      Alert.alert('Error', 'An error occurred while submitting your feedback. Please try again later.');
    }
  };
  
  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colorScheme === 'dark' ? headerGradientDark : headerGradientLight}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Doctor Feedback</ThemedText>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'pending' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <ThemedText 
            style={[
              styles.tabButtonText,
              activeTab === 'pending' && styles.activeTabButtonText
            ]}
          >
            Pending ({pendingFeedbacks.length})
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'submitted' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('submitted')}
        >
          <ThemedText 
            style={[
              styles.tabButtonText,
              activeTab === 'submitted' && styles.activeTabButtonText
            ]}
          >
            Submitted ({submittedFeedbacks.length})
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Feedback Content */}
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'pending' && (
          <>
            {pendingFeedbacks.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <MaterialIcons 
                  name="feedback" 
                  size={60} 
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ opacity: 0.5 }}
                />
                <ThemedText style={styles.emptyStateText}>
                  No pending feedback requests
                </ThemedText>
              </ThemedView>
            ) : (
              <>
                <ThemedText style={styles.sectionDescription}>
                  Please provide feedback for your recent appointments. Your input helps us improve our services.
                </ThemedText>
                
                {pendingFeedbacks.map(doctor => (
                  <ThemedView key={doctor.id} style={styles.doctorCard}>
                    <View style={styles.doctorInfoSection}>
                      <View style={styles.doctorAvatarContainer}>
                        {doctor.imageUrl ? (
                          <Ionicons name="person-circle" size={50} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                        ) : (
                          <Ionicons name="person-circle" size={50} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                        )}
                      </View>
                      
                      <View style={styles.doctorDetails}>
                        <ThemedText style={styles.doctorName}>{doctor.doctorName}</ThemedText>
                        <View style={styles.specialtyContainer}>
                          <FontAwesome5 name="stethoscope" size={12} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                          <ThemedText style={styles.specialtyText}>{doctor.specialty}</ThemedText>
                        </View>
                        <ThemedText style={styles.appointmentDetail}>
                          {doctor.appointmentType} • {doctor.appointmentDate}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.provideFeedbackButton}
                      onPress={() => openFeedbackForm(doctor)}
                    >
                      <ThemedText style={styles.provideFeedbackButtonText}>
                        Provide Feedback
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'submitted' && (
          <>
            {submittedFeedbacks.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <MaterialIcons 
                  name="history" 
                  size={60} 
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ opacity: 0.5 }}
                />
                <ThemedText style={styles.emptyStateText}>
                  No feedback history yet
                </ThemedText>
              </ThemedView>
            ) : (
              <>
                <ThemedText style={styles.sectionDescription}>
                  Thank you for your feedback. Your input helps us improve our services.
                </ThemedText>
                
                {submittedFeedbacks.map(feedback => (
                  <ThemedView key={feedback.id} style={styles.feedbackHistoryCard}>
                    <View style={styles.feedbackCardHeader}>
                      <View style={styles.doctorInfoRow}>
                        <View style={styles.avatarContainer}>
                          <Ionicons name="person-circle" size={45} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                        </View>
                        
                        <View style={styles.doctorInfo}>
                          <View style={styles.doctorNameRow}>
                            <ThemedText style={styles.doctorName}>{feedback.doctorName}</ThemedText>
                            <View style={styles.feedbackDateContainer}>
                              <Ionicons name="calendar-outline" size={14} color={Colors[colorScheme ?? 'light'].text} style={{ opacity: 0.7 }} />
                              <ThemedText style={styles.feedbackDate}>{feedback.date}</ThemedText>
                            </View>
                          </View>
                          <View style={styles.specialtyRow}>
                            <FontAwesome5 name="stethoscope" size={12} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                            <ThemedText style={styles.specialtyText}>{feedback.specialty}</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.feedbackContent}>
                      <View style={styles.ratingSection}>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <MaterialIcons
                              key={star}
                              name="star"
                              size={24}
                              color={star <= feedback.rating ? '#FFC107' : '#D1D1D1'}
                              style={styles.starSpacing}
                            />
                          ))}
                        </View>
                        <ThemedText style={styles.ratingText}>
                          {feedback.rating === 5 ? 'Excellent' : 
                          feedback.rating === 4 ? 'Very Good' : 
                          feedback.rating === 3 ? 'Good' : 
                          feedback.rating === 2 ? 'Fair' : 'Poor'}
                        </ThemedText>
                      </View>

                      {feedback.comment && (
                        <View style={styles.commentSection}>
                          <ThemedView style={styles.commentBox}>
                            <ThemedText style={styles.commentText}>"{feedback.comment}"</ThemedText>
                          </ThemedView>
                        </View>
                      )}

                      <View style={styles.appointmentInfo}>
                        <Ionicons name="time-outline" size={16} color={Colors[colorScheme ?? 'light'].text} style={{ opacity: 0.7 }} />
                        <ThemedText style={styles.appointmentDate}>Appointment on {feedback.appointmentDate}</ThemedText>
                      </View>
                    </View>
                  </ThemedView>
                ))}
              </>
            )}
          </>
        )}

        {/* Loading state */}
        {isLoading && (
          <ThemedView style={styles.emptyState}>
            <MaterialIcons 
              name="refresh" 
              size={40} 
              color={Colors[colorScheme ?? 'light'].text}
              style={{ opacity: 0.7 }}
            />
            <ThemedText style={styles.emptyStateText}>
              Loading feedback data...
            </ThemedText>
          </ThemedView>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <ThemedView style={styles.emptyState}>
            <MaterialIcons 
              name="error-outline" 
              size={60} 
              color={Colors[colorScheme ?? 'light'].text}
              style={{ opacity: 0.5 }}
            />
            <ThemedText style={styles.emptyStateText}>
              {error}
            </ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadFeedbackData}
            >
              <ThemedText style={styles.retryButtonText}>
                Retry
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Bottom space for bottom tabs */}
        <View style={{ height: 100 }} />
      </ScrollView>      {/* Feedback form modal overlay */}
      {currentFeedbackDoctor && (
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Rate Your Experience</ThemedText>
              <TouchableOpacity onPress={closeFeedbackForm}>
                <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalDoctorInfo}>
              <ThemedText style={styles.modalDoctorName}>{currentFeedbackDoctor.doctorName}</ThemedText>
              <ThemedText style={styles.modalAppointmentInfo}>
                {currentFeedbackDoctor.appointmentType} • {currentFeedbackDoctor.appointmentDate}
              </ThemedText>
            </View>
            
            <View style={styles.ratingContainer}>
              <ThemedText style={styles.ratingLabel}>How was your experience?</ThemedText>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                  >
                    <MaterialIcons
                      name="star"
                      size={36}
                      style={styles.starIcon}
                      color={star <= rating ? '#FFC107' : '#D1D1D1'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <ThemedText style={styles.ratingText}>
                {rating > 0 ? 
                  (rating === 5 ? 'Excellent' : 
                  rating === 4 ? 'Very Good' : 
                  rating === 3 ? 'Good' : 
                  rating === 2 ? 'Fair' : 'Poor')
                  : ''}
              </ThemedText>
            </View>
            
            <View style={styles.feedbackInputContainer}>
              <ThemedText style={styles.feedbackLabel}>Additional Comments (Optional)</ThemedText>
              <TextInput
                style={[
                  styles.feedbackInput,
                  colorScheme === 'dark' && styles.feedbackInputDark
                ]}
                multiline
                numberOfLines={4}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Please share your experience with the doctor..."
                placeholderTextColor={colorScheme === 'dark' ? '#999' : '#888'}
              />
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitFeedback}
            >
              <ThemedText style={styles.submitButtonText}>
                Submit Feedback
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0a7ea4',
  },
  tabButtonText: {
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  doctorCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  doctorInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatarContainer: {
    marginRight: 15,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 13,
    marginLeft: 6,
  },
  appointmentDetail: {
    fontSize: 13,
    opacity: 0.7,
  },
  provideFeedbackButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  provideFeedbackButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  feedbackHistoryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackCardHeader: {
    marginBottom: 16,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  avatarContainer: {
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
    flexShrink: 1,
  },
  doctorNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
    maxWidth: '70%',
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialtyText: {
    fontSize: 14,
    marginLeft: 6,
    opacity: 0.7,
  },
  feedbackDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingLeft: 4,
  },
  feedbackDate: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  feedbackContent: {
    marginTop: 8,
  },
  ratingSection: {
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  starSpacing: {
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    color: '#0a7ea4',
  },
  commentSection: {
    marginBottom: 16,
  },
  commentBox: {
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
  },
  appointmentDate: {
    fontSize: 13,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 15,
    opacity: 0.7,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDoctorInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalDoctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalAppointmentInfo: {
    fontSize: 14,
    opacity: 0.7,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  feedbackInputContainer: {
    marginBottom: 24,
  },
  feedbackLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  feedbackInputDark: {
    backgroundColor: '#333',
    borderColor: '#555',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  }
});