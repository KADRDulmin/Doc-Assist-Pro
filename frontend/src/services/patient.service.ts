import api from '../config/api';
import { tokenService } from './token.service';

export interface PatientProfileData {
  id: number;
  user_id: number;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  allergies: string;
  medical_history: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export interface PatientProfileUpdateData {
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface PatientDashboardData {
  appointmentsCount: {
    upcoming: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  upcomingAppointment: any | null;
  recentAppointments: any[];
  medicalRecordsCount: number;
}

export interface ConsultedDoctor {
  id: number;
  name: string;
  specialization: string;
  lastConsultationDate: string;
  imageUrl?: string;
}

export interface BookAppointmentData {
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  notes?: string;
  symptoms?: string;
  possible_illness_1?: string;
  possible_illness_2?: string;
  parent_appointment_id?: number;
}

export interface DoctorAvailability {
  available_slots: string[];
  unavailable_slots?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class PatientService {
  /**
   * Get the profile of the authenticated patient
   */
  async getMyProfile(): Promise<ApiResponse<PatientProfileData>> {
    try {
      const token = await tokenService.getToken();
      if (!token) {
        console.error('[PatientService] No auth token available for getMyProfile request');
        throw new Error('Authentication required. Please login again.');
      }

      console.log('[PatientService] Fetching patient profile...');
      const response = await api.get('/api/patients/profile/me');
      return response as ApiResponse<PatientProfileData>;
    } catch (error) {
      console.error('[PatientService] Failed to fetch patient profile:', error);
      throw error;
    }
  }

  /**
   * Update the profile of the authenticated patient
   */
  async updateProfile(profileData: PatientProfileUpdateData): Promise<ApiResponse<PatientProfileData>> {
    try {
      const token = await tokenService.getToken();
      if (!token) {
        console.error('[PatientService] No auth token available for updateProfile request');
        throw new Error('Authentication required. Please login again.');
      }

      const response = await api.put('/api/patients/profile/me', profileData);
      return response as ApiResponse<PatientProfileData>;
    } catch (error) {
      console.error('[PatientService] Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics and information for the patient
   */
  async getDashboardData(): Promise<ApiResponse<PatientDashboardData>> {
    try {
      const token = await tokenService.getToken();
      if (!token) {
        console.error('[PatientService] No auth token available for getDashboardData request');
        throw new Error('Authentication required. Please login again.');
      }

      const response = await api.get('/api/patients/dashboard');
      return response as ApiResponse<PatientDashboardData>;
    } catch (error) {
      console.error('[PatientService] Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get medical records for the authenticated patient
   */
  async getMedicalRecords(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/patients/medical-records');
      return response as ApiResponse<any[]>;
    } catch (error) {
      console.error('[PatientService] Failed to get medical records:', error);
      throw error;
    }
  }

  /**
   * Get a specific medical record by ID
   */
  async getMedicalRecordById(recordId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`/api/patients/medical-records/${recordId}`);
      return response as ApiResponse<any>;
    } catch (error) {
      console.error(`[PatientService] Failed to get medical record ${recordId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all doctors the patient has consulted with
   */
  async getConsultedDoctors(): Promise<ApiResponse<ConsultedDoctor[]>> {
    try {
      const response = await api.get('/api/patients/consulted-doctors');
      return response as ApiResponse<ConsultedDoctor[]>;
    } catch (error) {
      console.error('[PatientService] Failed to get consulted doctors:', error);
      throw error;
    }
  }
  
  /**
   * Get available time slots for a doctor on a specific date
   */
  async getDoctorAvailability(doctorId: number, date: string): Promise<ApiResponse<DoctorAvailability>> {
    try {
      const response = await api.get(`/api/doctors/${doctorId}/availability`, {
        params: { date }
      });
      return response as ApiResponse<DoctorAvailability>;
    } catch (error) {
      console.error(`[PatientService] Failed to get doctor ${doctorId} availability:`, error);
      throw error;
    }
  }
  
  /**
   * Book an appointment with a doctor
   */
  async bookAppointment(data: BookAppointmentData): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/appointments', data);
      return response as ApiResponse<any>;
    } catch (error) {
      console.error('[PatientService] Failed to book appointment:', error);
      throw error;
    }
  }
}

export default new PatientService();