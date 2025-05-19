import BaseApiService from './api/base-api.service';
import { ApiResponse } from './api/api-response.type';
import { AppointmentNotificationManager } from './appointment-notification.service';

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
  parent_appointment_id?: number;
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
    return this.get<ApiResponse<AppointmentData[]>>('/my-appointments');
  }

  async getUpcomingAppointments(): Promise<ApiResponse<AppointmentData[]>> {
    const response = await this.get<ApiResponse<AppointmentData[]>>('/my-appointments');
    if (response.success) {
      const now = new Date();
      const upcomingAppointments = response.data.filter((appointment: AppointmentData) => {
        const appointmentDate = new Date(`${appointment.appointment_date} ${appointment.appointment_time}`);
        return appointmentDate > now && 
               appointment.status === 'upcoming' && 
               !['cancelled', 'missed'].includes(appointment.status);
      });
      return {
        success: true,
        data: upcomingAppointments
      };
    }
    return response;
  }

  async getCompletedAppointments(): Promise<ApiResponse<AppointmentData[]>> {
    return this.get<ApiResponse<AppointmentData[]>>('/my-appointments?status=completed');
  }

  async getAppointmentById(id: number): Promise<ApiResponse<AppointmentData>> {
    return this.get<ApiResponse<AppointmentData>>(`/${id}`);
  }

  async createAppointment(appointmentData: Partial<AppointmentData>): Promise<ApiResponse<AppointmentData>> {
    const response = await this.post<ApiResponse<AppointmentData>>('', appointmentData);
    if (response.success) {
      await AppointmentNotificationManager.scheduleAppointmentNotifications(response.data);
    }
    return response;
  }

  async updateAppointment(id: number, appointmentData: Partial<AppointmentData>): Promise<ApiResponse<AppointmentData>> {
    const response = await this.put<ApiResponse<AppointmentData>>(`/${id}`, appointmentData);
    if (response.success) {
      await AppointmentNotificationManager.cancelAppointmentNotifications();
      if (response.data.status === 'upcoming') {
        await AppointmentNotificationManager.scheduleAppointmentNotifications(response.data);
      }
    }
    return response;
  }

  async cancelAppointment(id: number): Promise<ApiResponse<AppointmentData>> {
    const response = await this.post<ApiResponse<AppointmentData>>(`/${id}/cancel`, {});
    if (response.success) {
      await AppointmentNotificationManager.cancelAppointmentNotifications();
    }
    return response;
  }

  async completeAppointment(id: number): Promise<ApiResponse<AppointmentData>> {
    const response = await this.put<ApiResponse<AppointmentData>>(`/${id}/complete`, {});
    if (response.success) {
      await AppointmentNotificationManager.cancelAppointmentNotifications();
    }
    return response;
  }

  async getConsultationByAppointment(appointmentId: number): Promise<ApiResponse<ConsultationData>> {
    return this.get<ApiResponse<ConsultationData>>(`/${appointmentId}/consultation`);
  }

  async getDoctorAvailability(doctorId: number, date: string): Promise<ApiResponse<{available: boolean; slots: string[]}>> {
    return this.get<ApiResponse<{available: boolean; slots: string[]}>>(`/availability/${doctorId}?date=${date}`);
  }

  async getTodaysAppointments(): Promise<ApiResponse<AppointmentData[]>> {
    return this.get<ApiResponse<AppointmentData[]>>('/today');
  }

  private async handleMissedAppointment(appointment: AppointmentData) {
    await AppointmentNotificationManager.sendMissedAppointmentNotification(appointment);
  }
}

export default new AppointmentService();