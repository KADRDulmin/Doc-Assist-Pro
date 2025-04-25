import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [currentFeedbackDoctor, setCurrentFeedbackDoctor] = useState<PendingFeedback | null>(null);
  
  // Mock data for feedback history
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<DoctorFeedback[]>([
    {
      id: 1,
      doctorId: 101,
      doctorName: 'Dr. Robert Lee',
      specialty: 'Dermatology',
      appointmentDate: 'Apr 10, 2025',
      rating: 4,
      comment: 'Very professional and thorough in examination. Explained everything clearly.',
      date: 'Apr 11, 2025',
    },
    {
      id: 2,
      doctorId: 102,
      doctorName: 'Dr. Maria Garcia',
      specialty: 'Orthopedics',
      appointmentDate: 'Mar 22, 2025',
      rating: 5,
      comment: 'Dr. Garcia was exceptional. She took time to listen to all my concerns and provided excellent treatment options.',
      date: 'Mar 23, 2025',
    }
  ]);

  // Mock data for pending feedbacks
  const [pendingFeedbacks, setPendingFeedbacks] = useState<PendingFeedback[]>([
    {
      id: 1,
      doctorId: 103,
      doctorName: 'Dr. Emily Chen',
      specialty: 'Cardiology',
      appointmentDate: 'Apr 25, 2025',
      appointmentType: 'Follow-up',
    },
    {
      id: 2,
      doctorId: 104,
      doctorName: 'Dr. Michael Wong',
      specialty: 'General Medicine',
      appointmentDate: 'Apr 20, 2025',
      appointmentType: 'Check-up',
    }
  ]);

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

  const submitFeedback = () => {
    if (!currentFeedbackDoctor) return;
    
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating for the doctor.');
      return;
    }
    
    // Create new feedback
    const newFeedback: DoctorFeedback = {
      id: Date.now(),
      doctorId: currentFeedbackDoctor.doctorId,
      doctorName: currentFeedbackDoctor.doctorName,
      specialty: currentFeedbackDoctor.specialty,
      appointmentDate: currentFeedbackDoctor.appointmentDate,
      rating,
      comment: feedbackText,
      date: 'Apr 25, 2025', // Today's date
    };
    
    // Add to submitted feedbacks
    setSubmittedFeedbacks([newFeedback, ...submittedFeedbacks]);
    
    // Remove from pending feedbacks
    setPendingFeedbacks(pendingFeedbacks.filter(pf => pf.id !== currentFeedbackDoctor.id));
    
    // Close form
    closeFeedbackForm();
    
    Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
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
                      <View style={styles.doctorInfoSection}>
                        <View style={styles.doctorAvatarContainer}>
                          <Ionicons name="person-circle" size={40} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                        </View>
                        
                        <View style={styles.doctorDetails}>
                          <ThemedText style={styles.doctorName}>{feedback.doctorName}</ThemedText>
                          <View style={styles.specialtyContainer}>
                            <FontAwesome5 name="stethoscope" size={12} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                            <ThemedText style={styles.specialtyText}>{feedback.specialty}</ThemedText>
                          </View>
                        </View>
                      </View>
                      
                      <ThemedText style={styles.feedbackDate}>
                        Submitted on {feedback.date}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.feedbackRatingContainer}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <MaterialIcons
                          key={star}
                          name="star"
                          size={20}
                          color={star <= feedback.rating ? '#FFC107' : '#D1D1D1'}
                        />
                      ))}
                    </View>
                    
                    {feedback.comment && (
                      <ThemedText style={styles.feedbackComment}>
                        "{feedback.comment}"
                      </ThemedText>
                    )}
                    
                    <View style={styles.appointmentDateContainer}>
                      <ThemedText style={styles.appointmentDateLabel}>Appointment Date:</ThemedText>
                      <ThemedText style={styles.appointmentDateValue}>{feedback.appointmentDate}</ThemedText>
                    </View>
                  </ThemedView>
                ))}
              </>
            )}
          </>
        )}

        {/* Bottom space for bottom tabs */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Feedback form modal overlay */}
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
                  rating === 5 ? 'Excellent' : 
                  rating === 4 ? 'Very Good' : 
                  rating === 3 ? 'Good' : 
                  rating === 2 ? 'Fair' : 'Poor'
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
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  feedbackDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  feedbackRatingContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  feedbackComment: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 20,
  },
  appointmentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  appointmentDateLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginRight: 6,
  },
  appointmentDateValue: {
    fontSize: 13,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '500',
    marginTop: 5,
  },
  feedbackInputContainer: {
    marginBottom: 20,
  },
  feedbackLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  feedbackInputDark: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    fontWeight: '600',
    fontSize: 16,
  },
});