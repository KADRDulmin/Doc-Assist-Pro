import BaseApiService from './api/base-api.service';
import { ApiResponse } from './api/api-response.type';

export interface AppointmentData {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'missed';
  appointment_type: string;
  notes?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: number;
    specialization: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
    };
  };
  patient?: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
    };
  };
}

export interface ConsultationData {
  id: number;
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  status: 'in_progress' | 'completed' | 'missed';
  actual_start_time: string;
  actual_end_time?: string;
  created_at: string;
  updated_at: string;
  doctor?: any;
  patient?: any;
}

export interface MedicalRecordData {
  id: number;
  consultation_id: number;
  patient_id: number;
  doctor_id: number;
  record_date: string;
  diagnosis: string;
  diagnosis_image_url?: string;
  treatment_plan?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor?: any;
  patient?: any;
}

export interface PrescriptionData {
  id: number;
  consultation_id: number;
  patient_id: number;
  doctor_id: number;
  prescription_date: string;
  prescription_text?: string;
  prescription_image_url?: string;
  status: 'active' | 'completed' | 'cancelled';
  duration_days?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor?: any;
  patient?: any;
}

class AppointmentService extends BaseApiService {
  constructor() {
    super('/api/appointments');
  }

  async getMyAppointments(): Promise<ApiResponse<AppointmentData[]>> {
    return this.get('/my-appointments');
  }

  async getUpcomingAppointments(): Promise<ApiResponse<AppointmentData[]>> {
    return this.get('/my-appointments?status=upcoming');
  }

  async getAppointmentById(id: number): Promise<ApiResponse<AppointmentData>> {
    return this.get(`/${id}`);
  }

  async createAppointment(appointmentData: any): Promise<ApiResponse<AppointmentData>> {
    return this.post('', appointmentData);
  }

  async updateAppointment(id: number, appointmentData: any): Promise<ApiResponse<AppointmentData>> {
    return this.put(`/${id}`, appointmentData);
  }

  async cancelAppointment(id: number): Promise<ApiResponse<AppointmentData>> {
    return this.put(`/${id}/cancel`);
  }

  async completeAppointment(id: number): Promise<ApiResponse<AppointmentData>> {
    return this.put(`/${id}/complete`);
  }

  async getConsultationByAppointment(appointmentId: number): Promise<ApiResponse<ConsultationData>> {
    return this.get(`/${appointmentId}/consultation`);
  }

  async getDoctorAvailability(doctorId: number, date: string): Promise<ApiResponse<any>> {
    return this.get(`/availability/${doctorId}?date=${date}`);
  }

  async getTodaysAppointments(): Promise<ApiResponse<AppointmentData[]>> {
    return this.get('/today');
  }
}

export default new AppointmentService();