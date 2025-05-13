import api from '../config/api';

export interface FeedbackData {
  id?: number;
  appointment_id: number;
  doctor_id: number;
  patient_id?: number;
  rating: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
  doctor?: any; // Adding doctor field to match the data structure in the response
}

export interface NewFeedback {
  doctor_id: number;
  appointment_id?: number;
  rating: number;
  comment?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class FeedbackService {  /**
   * Submit feedback for an appointment
   */
  async submitFeedback(feedbackData: NewFeedback): Promise<ApiResponse<FeedbackData>> {
    const response = await api.post('/api/feedback', feedbackData);
    return response as ApiResponse<FeedbackData>;
  }

  /**
   * Get all feedback submitted by the current user
   */
  async getMyFeedback(): Promise<ApiResponse<FeedbackData[]>> {
    const response = await api.get('/api/feedback/my-feedback');
    return response as ApiResponse<FeedbackData[]>;
  }

  /**
   * Get feedback by appointment ID
   */
  async getAppointmentFeedback(appointmentId: number): Promise<ApiResponse<FeedbackData>> {
    const response = await api.get(`/api/feedback/appointment/${appointmentId}`);
    return response as ApiResponse<FeedbackData>;
  }

  /**
   * Get all feedback for a doctor
   */
  async getDoctorFeedback(doctorId: number): Promise<ApiResponse<FeedbackData[]>> {
    const response = await api.get(`/api/feedback/doctor/${doctorId}`);
    return response as ApiResponse<FeedbackData[]>;
  }

  /**
   * Update existing feedback
   */
  async updateFeedback(feedbackId: number, feedbackData: Partial<FeedbackData>): Promise<ApiResponse<FeedbackData>> {
    const response = await api.put(`/api/feedback/${feedbackId}`, feedbackData);
    return response as ApiResponse<FeedbackData>;
  }
}

export default new FeedbackService();