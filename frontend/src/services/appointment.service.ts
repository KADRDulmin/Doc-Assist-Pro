import api from '../config/api';

export interface AppointmentData {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'missed';
  notes?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: number;
    user_id: number;
    specialization: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
    }
  };
  patient?: {
    id: number;
    user_id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
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
  async getMyAppointments(status?: 'upcoming' | 'completed' | 'cancelled'): Promise<ApiResponse<AppointmentData[]>> {
    const params = status ? { status } : {};
    const response = await api.get('/api/appointments/my-appointments', { params });
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
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: number): Promise<ApiResponse<AppointmentData>> {
    const response = await api.get(`/api/appointments/${appointmentId}`);
    return response as ApiResponse<AppointmentData>;
  }

  /**
   * Update an appointment
   */
  async updateAppointment(appointmentId: number, updateData: Partial<NewAppointment>): Promise<ApiResponse<AppointmentData>> {
    const response = await api.put(`/api/appointments/${appointmentId}`, updateData);
    return response as ApiResponse<AppointmentData>;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: number): Promise<ApiResponse<AppointmentData>> {
    // Added empty object as the required data parameter to fix TypeScript error
    const response = await api.post(`/api/appointments/${appointmentId}/cancel`, {});
    return response as ApiResponse<AppointmentData>;
  }
}

export default new AppointmentService();