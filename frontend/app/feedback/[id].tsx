import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import appointmentService, { AppointmentData } from '@/src/services/appointment.service';
import feedbackService from '@/src/services/feedback.service';

export default function FeedbackScreen() {
  const params = useLocalSearchParams();
  const appointmentId = typeof params.id === 'string' ? parseInt(params.id) : 0;
  
  const colorScheme = useColorScheme();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentDetails();
    } else {
      setError('Invalid appointment ID');
      setLoading(false);
    }
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      const response = await appointmentService.getAppointmentById(appointmentId);
      
      if (response.success && response.data) {
        setAppointment(response.data);
        // Check if feedback already exists
        try {
          const feedbackResponse = await feedbackService.getAppointmentFeedback(appointmentId);
          if (feedbackResponse.success && feedbackResponse.data) {
            // Feedback already exists, pre-populate the form
            setRating(feedbackResponse.data.rating);
            setComment(feedbackResponse.data.comment || '');
            Alert.alert('Feedback Exists', 'You have already submitted feedback for this appointment. You can update it if you wish.');
          }
        } catch (err) {
          // No feedback exists yet, or error fetching feedback - just continue
        }
      } else {
        setError(response.message || 'Failed to load appointment details');
      }
    } catch (err: any) {
      console.error('Error loading appointment details:', err);
      setError(err?.message || 'An error occurred while loading the appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const feedbackData = {
        appointment_id: appointmentId,
        doctor_id: appointment?.doctor_id || 0,
        rating,
        comment
      };

      const response = await feedbackService.submitFeedback(feedbackData);
      
      if (response.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit feedback');
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      Alert.alert('Error', err?.message || 'An error occurred while submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const RatingStars = () => (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Ionicons
            name={rating >= star ? 'star' : 'star-outline'}
            size={40}
            color={rating >= star ? '#FFC107' : colorScheme === 'dark' ? '#555' : '#ccc'}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading appointment details...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadAppointmentDetails}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Leave Feedback',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
            },
            headerTintColor: '#fff',
          }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {appointment?.doctor && (
            <ThemedView style={styles.doctorCard}>
              <View style={styles.doctorAvatarContainer}>
                <LinearGradient
                  colors={colorScheme === 'dark' ? ['#1D3D47', '#0f1e23'] : ['#A1CEDC', '#78b1c4']}
                  style={styles.doctorAvatar}
                >
                  <Ionicons name="person" size={40} color="#fff" />
                </LinearGradient>
              </View>
              
              <View style={styles.doctorInfo}>
                <ThemedText style={styles.doctorName}>
                  Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}
                </ThemedText>
                <ThemedText style={styles.doctorSpecialty}>
                  {appointment.doctor.specialization}
                </ThemedText>
              </View>
            </ThemedView>
          )}

          <ThemedView style={styles.feedbackCard}>
            <ThemedText style={styles.feedbackTitle}>Rate Your Experience</ThemedText>
            <ThemedText style={styles.feedbackSubtitle}>
              How was your appointment on {new Date(appointment?.appointment_date || '').toLocaleDateString()}?
            </ThemedText>
            
            <RatingStars />
            
            <ThemedText style={styles.commentLabel}>Additional Comments (Optional)</ThemedText>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colorScheme === 'dark' ? '#333' : '#f9f9f9',
                  color: colorScheme === 'dark' ? '#fff' : '#000',
                  borderColor: colorScheme === 'dark' ? '#444' : '#e0e0e0',
                }
              ]}
              placeholder="Share your experience with this doctor..."
              placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#999'}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitFeedback}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <ThemedText style={styles.submitButtonText}>Submit Feedback</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  doctorAvatarContainer: {
    marginRight: 15,
  },
  doctorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  doctorSpecialty: {
    fontSize: 14,
    opacity: 0.7,
  },
  feedbackCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});