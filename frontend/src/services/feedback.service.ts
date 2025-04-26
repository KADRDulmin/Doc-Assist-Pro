import api from '../config/api';

export interface FeedbackData {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: number;
    specialization: string;
    user: {
      first_name: string;
      last_name: string;
    }
  };
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

class FeedbackService {
  /**
   * Submit new feedback
   */
  async submitFeedback(feedbackData: NewFeedback): Promise<ApiResponse<FeedbackData>> {
    const response = await api.post('/api/feedback', feedbackData);
    return response as ApiResponse<FeedbackData>;
  }

  /**
   * Get all feedback submitted by the authenticated user
   */
  async getMyFeedback(): Promise<ApiResponse<FeedbackData[]>> {
    const response = await api.get('/api/feedback/my-feedback');
    return response as ApiResponse<FeedbackData[]>;
  }

  /**
   * Get feedback for a specific doctor
   */
  async getDoctorFeedback(doctorId: number): Promise<ApiResponse<FeedbackData[]>> {
    const response = await api.get(`/api/feedback/doctor/${doctorId}`);
    return response as ApiResponse<FeedbackData[]>;
  }

  /**
   * Update existing feedback
   */
  async updateFeedback(feedbackId: number, updateData: { rating?: number; comment?: string }): Promise<ApiResponse<FeedbackData>> {
    const response = await api.put(`/api/feedback/${feedbackId}`, updateData);
    return response as ApiResponse<FeedbackData>;
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(feedbackId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    const response = await api.delete(`/api/feedback/${feedbackId}`);
    return response as ApiResponse<{ deleted: boolean }>;
  }
}

export default new FeedbackService();