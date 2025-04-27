import api, { ApiResponse } from './api';
import { DoctorProfile } from './authService';

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
  patient?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DashboardData {
  profile: DoctorProfile;
  todayAppointments: AppointmentData[];
  stats: {
    appointmentCount: number;
    patientCount: number;
    completedAppointments: number;
    upcomingAppointments: number;
  }
}

export interface PatientData {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  appointment_count: number;
  completed_appointments: number;
  cancelled_appointments: number;
  upcoming_appointments: number;
}

const doctorService = {
  // Get doctor's profile
  getProfile: async (token: string): Promise<ApiResponse<DoctorProfile>> => {
    return api.get<DoctorProfile>('/doctors/profile/me', token);
  },
  
  // Update doctor's profile
  updateProfile: async (profileData: Partial<DoctorProfile>, token: string): Promise<ApiResponse<DoctorProfile>> => {
    return api.put<DoctorProfile>('/doctors/profile/me', profileData, token);
  },
  
  // Get doctor's dashboard data - Now with user ID support
  getDashboard: async (token: string, userId?: number): Promise<ApiResponse<DashboardData>> => {
    // If userId is provided, use the user-specific endpoint
    if (userId) {
      return api.get<DashboardData>(`/doctors/dashboard/user/${userId}`, token);
    }
    
    // Try the standard endpoint first
    const response = await api.get<DashboardData>('/doctors/dashboard', token);
    
    // If the standard endpoint returns an error, try to get the user ID from the token
    if (!response.success && response.error === 'Doctor not found') {
      try {
        // Get user info to extract ID
        const userResponse = await api.get<any>('/doctors/debug/current-user', token);
        
        if (userResponse.success && userResponse.data?.id) {
          // Try the user-specific endpoint
          return api.get<DashboardData>(`/doctors/dashboard/user/${userResponse.data.id}`, token);
        }
      } catch (err) {
        console.error('Failed to get user ID for dashboard fallback', err);
      }
    }
    
    // Return the original response if fallback doesn't work or is not needed
    return response;
  },
  
  // Get doctor's appointments - Now with user ID support
  getAppointments: async (token: string, userId?: number, status?: string): Promise<ApiResponse<AppointmentData[]>> => {
    try {
      // If userId is provided, use the user-specific endpoint
      if (userId) {
        const endpoint = status 
          ? `/doctors/appointments/user/${userId}?status=${status}` 
          : `/doctors/appointments/user/${userId}`;
        return api.get<AppointmentData[]>(endpoint, token);
      }
      
      // Try the standard endpoint
      const endpoint = status ? `/doctors/appointments?status=${status}` : '/doctors/appointments';
      const response = await api.get<AppointmentData[]>(endpoint, token);
      
      // If standard endpoint fails, try to get the user ID
      if (!response.success && response.error === 'Doctor not found') {
        try {
          // Get user info to extract ID
          const userResponse = await api.get<any>('/doctors/debug/current-user', token);
          
          if (userResponse.success && userResponse.data?.id) {
            // Try the user-specific endpoint
            const userId = userResponse.data.id;
            const userEndpoint = status 
              ? `/doctors/appointments/user/${userId}?status=${status}` 
              : `/doctors/appointments/user/${userId}`;
            return api.get<AppointmentData[]>(userEndpoint, token);
          }
        } catch (err) {
          console.error('Failed to get user ID for appointments fallback', err);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`API Error for appointments:`, error);
      throw error;
    }
  },
  
  // Get doctor's patients - Now with user ID support
  getPatients: async (token: string, userId?: number, search?: string): Promise<ApiResponse<PatientData[]>> => {
    try {
      // If userId is provided, use the user-specific endpoint
      if (userId) {
        const endpoint = search 
          ? `/doctors/patients/user/${userId}?search=${search}` 
          : `/doctors/patients/user/${userId}`;
        return api.get<PatientData[]>(endpoint, token);
      }
      
      // Try the standard endpoint
      const endpoint = search ? `/doctors/patients?search=${search}` : '/doctors/patients';
      const response = await api.get<PatientData[]>(endpoint, token);
      
      // If standard endpoint fails, try to get the user ID
      if (!response.success && response.error === 'Doctor not found') {
        try {
          // Get user info to extract ID
          const userResponse = await api.get<any>('/doctors/debug/current-user', token);
          
          if (userResponse.success && userResponse.data?.id) {
            // Try the user-specific endpoint
            const userId = userResponse.data.id;
            const userEndpoint = search 
              ? `/doctors/patients/user/${userId}?search=${search}` 
              : `/doctors/patients/user/${userId}`;
            return api.get<PatientData[]>(userEndpoint, token);
          }
        } catch (err) {
          console.error('Failed to get user ID for patients fallback', err);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`API Error for patients:`, error);
      throw error;
    }
  },
  
  // Update appointment status
  updateAppointmentStatus: async (
    appointmentId: number, 
    status: 'completed' | 'cancelled', 
    token: string
  ): Promise<ApiResponse<AppointmentData>> => {
    return api.put<AppointmentData>(`/appointments/${appointmentId}`, { status }, token);
  },
  
  // Complete an appointment
  completeAppointment: async (appointmentId: number, token: string): Promise<ApiResponse<AppointmentData>> => {
    return api.post<AppointmentData>(`/appointments/${appointmentId}/complete`, {}, token);
  },
  
  // Get doctor's availability for a specific date
  getAvailability: async (doctorId: number, date: string, token: string): Promise<ApiResponse<{
    date: string;
    doctorId: number;
    available_slots: string[];
    booked_slots: string[];
  }>> => {
    return api.get<any>(`/appointments/doctors/${doctorId}/availability?date=${date}`, token);
  }
};

export default doctorService;