import api from '../config/api';
import { SymptomAnalysisResult } from './symptomAnalysis.service';

export interface AppointmentData {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  notes: string;
  location: string;
  symptoms?: string;
  possible_illness_1?: string;
  possible_illness_2?: string;
  recommended_doctor_speciality_1?: string;
  recommended_doctor_speciality_2?: string;
  criticality?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: number;
    specialization: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    }
  };
  patient?: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    }
  };
}

export interface NewAppointment {
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  notes?: string;
  location?: string;
  symptoms?: string;
  possible_illness_1?: string;
  possible_illness_2?: string;
  recommended_doctor_speciality_1?: string;
  recommended_doctor_speciality_2?: string;
  criticality?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class AppointmentService {
  /**
   * Get all appointments for the authenticated user
   */
  async getMyAppointments(): Promise<ApiResponse<AppointmentData[]>> {
    const response = await api.get('/api/appointments/my-appointments');
    return response as ApiResponse<AppointmentData[]>;
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: NewAppointment): Promise<ApiResponse<AppointmentData>> {
    const response = await api.post('/api/appointments', appointmentData);
    return response as ApiResponse<AppointmentData>;
  }

  /**
   * Create a new appointment with symptom analysis
   */
  async createAppointmentWithSymptomAnalysis(appointmentData: {
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
    notes?: string;
    location?: string;
    symptoms: string;
    symptomAnalysis: SymptomAnalysisResult;
  }): Promise<ApiResponse<AppointmentData>> {
    // Map the symptom analysis result to the appointment data format
    const appointmentWithAnalysis = {
      ...appointmentData,
      possible_illness_1: appointmentData.symptomAnalysis.possibleIllness1,
      possible_illness_2: appointmentData.symptomAnalysis.possibleIllness2,
      recommended_doctor_speciality_1: appointmentData.symptomAnalysis.recommendedDoctorSpeciality1,
      recommended_doctor_speciality_2: appointmentData.symptomAnalysis.recommendedDoctorSpeciality2,
      criticality: appointmentData.symptomAnalysis.criticality,
      // Add the explanation to the notes if provided
      notes: appointmentData.notes 
        ? `${appointmentData.notes}\n\nAI Analysis: ${appointmentData.symptomAnalysis.explanation}`
        : `AI Analysis: ${appointmentData.symptomAnalysis.explanation}`
    };
    
    // Remove the symptomAnalysis property as it's not needed in the API call
    const { symptomAnalysis, ...appointmentToSubmit } = appointmentWithAnalysis;
    
    const response = await api.post('/api/appointments', appointmentToSubmit);
    return response as ApiResponse<AppointmentData>;
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: number): Promise<ApiResponse<AppointmentData>> {
    const response = await api.get(`/api/appointments/${appointmentId}`);
    return response as ApiResponse<AppointmentData>;
  }

  /**
   * Update an appointment
   */
  async updateAppointment(appointmentId: number, updateData: Partial<AppointmentData>): Promise<ApiResponse<AppointmentData>> {
    const response = await api.put(`/api/appointments/${appointmentId}`, updateData);
    return response as ApiResponse<AppointmentData>;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: number): Promise<ApiResponse<AppointmentData>> {
    const response = await api.post(`/api/appointments/${appointmentId}/cancel`);
    return response as ApiResponse<AppointmentData>;
  }

  /**
   * Get doctor availability for a specific date
   */
  async getDoctorAvailability(doctorId: number, date: string): Promise<ApiResponse<{
    available_slots: string[];
    booked_slots: string[];
  }>> {
    const response = await api.get(`/api/appointments/availability/${doctorId}`, {
      params: { date }
    });
    return response as ApiResponse<{ available_slots: string[]; booked_slots: string[] }>;
  }
}

export default new AppointmentService();