import api, { ApiResponse, BASE_URL } from './api';
import { DoctorProfile } from './authService';

export interface FeedbackData {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  patient?: {
    id: number;
    name?: string;
    user?: {
      first_name: string;
      last_name: string;
    }
  };
}

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
  symptoms?: string;
  possible_illness_1?: string;
  possible_illness_2?: string;
  recommended_doctor_speciality_1?: string;
  recommended_doctor_speciality_2?: string;
  criticality?: string;
  symptom_analysis_json?: string;
  feedback?: FeedbackData; // Add feedback data to appointments
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
  patient?: {
    id: number;
    user?: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
    };
  };
  doctor?: {
    id: number;
    specialization: string;
    user?: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
    };
  };
  appointment?: AppointmentData;
  medical_records?: MedicalRecordData[];
  prescriptions?: PrescriptionData[];
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
}

export interface PrescriptionData {
  id: number;
  consultation_id: number;
  patient_id: number;
  doctor_id: number;
  prescription_date: string;
  prescription_text: string;
  prescription_image_url?: string;
  status: 'active' | 'completed' | 'cancelled';
  duration_days?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
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

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export interface DoctorWithDistanceData extends DoctorProfile {
  distance?: number;
  availableToday?: boolean;
}

// Helper function to get current user ID
const getCurrentUserId = async (token: string): Promise<number | undefined> => {
  try {
    const userResponse = await api.get<any>('/doctors/debug/current-user', token);
    if (userResponse.success && userResponse.data?.id) {
      return userResponse.data.id;
    }
    return undefined;
  } catch (err) {
    console.error('Failed to get current user ID:', err);
    return undefined;
  }
};

const doctorService = {
  // Include the BASE_URL for access in other components
  BASE_URL,
  
  // Get doctor's profile
  getProfile: async (token: string): Promise<ApiResponse<DoctorProfile>> => {
    return api.get<DoctorProfile>('/doctors/profile/me', token);
  },
  
  // Update doctor's profile
  updateProfile: async (profileData: Partial<DoctorProfile>, token: string): Promise<ApiResponse<DoctorProfile>> => {
    return api.put<DoctorProfile>('/doctors/profile/me', profileData, token);
  },
  
  // Get doctor's dashboard data - Now always gets user ID first
  getDashboard: async (token: string, userId?: number): Promise<ApiResponse<DashboardData>> => {
    try {
      // If userId is not provided, get it first
      if (!userId) {
        userId = await getCurrentUserId(token);
        if (!userId) {
          // If we couldn't get the user ID, try the original endpoint as fallback
          return await api.get<DashboardData>('/doctors/dashboard', token);
        }
      }
      
      // Use the user-specific endpoint
      return await api.get<DashboardData>(`/doctors/dashboard/user/${userId}`, token);
    } catch (error) {
      console.error(`API Error for dashboard:`, error);
      throw error;
    }
  },
  
  // Get doctor's appointments - Now always gets user ID first
  getAppointments: async (token: string, userId?: number, status?: string): Promise<ApiResponse<AppointmentData[]>> => {
    try {
      // If userId is not provided, get it first
      if (!userId) {
        userId = await getCurrentUserId(token);
        if (!userId) {
          // If we couldn't get the user ID, try the original endpoint as fallback
          const endpoint = status ? `/doctors/appointments?status=${status}` : '/doctors/appointments';
          return await api.get<AppointmentData[]>(endpoint, token);
        }
      }
      
      // Use the user-specific endpoint
      const endpoint = status 
        ? `/doctors/appointments/user/${userId}?status=${status}` 
        : `/doctors/appointments/user/${userId}`;
      return await api.get<AppointmentData[]>(endpoint, token);
    } catch (error) {
      console.error(`API Error for appointments:`, error);
      throw error;
    }
  },
  
  // Get doctor's patients - Now always gets user ID first
  getPatients: async (token: string, userId?: number, search?: string): Promise<ApiResponse<PatientData[]>> => {
    try {
      // If userId is not provided, get it first
      if (!userId) {
        userId = await getCurrentUserId(token);
        if (!userId) {
          // If we couldn't get the user ID, try the original endpoint as fallback
          const endpoint = search ? `/doctors/patients?search=${search}` : '/doctors/patients';
          return await api.get<PatientData[]>(endpoint, token);
        }
      }
      
      // Use the user-specific endpoint
      const endpoint = search 
        ? `/doctors/patients/user/${userId}?search=${search}` 
        : `/doctors/patients/user/${userId}`;
      return await api.get<PatientData[]>(endpoint, token);
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
  },
  
  // Get today's appointments for the authenticated doctor
  getTodayAppointments: async (token: string, userId?: number): Promise<ApiResponse<AppointmentData[]>> => {
    try {
      return api.get<AppointmentData[]>('/appointments/today', token);
    } catch (error) {
      console.error(`API Error for today's appointments:`, error);
      throw error;
    }
  },

  // Consultation API methods
  
  // Start a new consultation for an appointment
  startConsultation: async (appointmentId: number, token: string): Promise<ApiResponse<ConsultationData>> => {
    return api.post<ConsultationData>(`/consultations/appointment/${appointmentId}/start`, {}, token);
  },
  
  // Get consultation by ID
  getConsultation: async (consultationId: number, token: string): Promise<ApiResponse<ConsultationData>> => {
    return api.get<ConsultationData>(`/consultations/${consultationId}`, token);
  },
  
  // Get consultation by appointment ID
  getConsultationByAppointment: async (appointmentId: number, token: string): Promise<ApiResponse<ConsultationData>> => {
    return api.get<ConsultationData>(`/consultations/appointment/${appointmentId}`, token);
  },
  
  // Complete a consultation
  completeConsultation: async (consultationId: number, token: string): Promise<ApiResponse<ConsultationData>> => {
    return api.post<ConsultationData>(`/consultations/${consultationId}/complete`, {}, token);
  },
  
  // Mark a consultation as missed
  markConsultationAsMissed: async (consultationId: number, token: string): Promise<ApiResponse<ConsultationData>> => {
    return api.post<ConsultationData>(`/consultations/${consultationId}/missed`, {}, token);
  },
  
  // Add medical record to a consultation
  addMedicalRecord: async (
    consultationId: number, 
    medicalRecordData: {
      diagnosis: string;
      diagnosis_image_url?: string;
      treatment_plan?: string;
      notes?: string;
    },
    token: string
  ): Promise<ApiResponse<MedicalRecordData>> => {
    return api.post<MedicalRecordData>(`/consultations/${consultationId}/medical-record`, medicalRecordData, token);
  },
  
  // Add prescription to a consultation
  addPrescription: async (
    consultationId: number,
    prescriptionData: {
      prescription_text: string;
      prescription_image_url?: string;
      duration_days?: number;
      notes?: string;
    },
    token: string
  ): Promise<ApiResponse<PrescriptionData>> => {
    return api.post<PrescriptionData>(`/consultations/${consultationId}/prescription`, prescriptionData, token);
  },
  
  // Submit complete consultation data
  submitConsultation: async (
    consultationId: number,
    consultationData: {
      diagnosis?: string;
      diagnosis_image_url?: string;
      treatment_plan?: string;
      medical_notes?: string;
      prescription_text?: string;
      prescription_image_url?: string;
      duration_days?: number;
      prescription_notes?: string;
      complete_consultation?: boolean;
    },
    token: string
  ): Promise<ApiResponse<{
    consultation: ConsultationData;
    medicalRecord?: MedicalRecordData;
    prescription?: PrescriptionData;
  }>> => {
    return api.post(`/consultations/${consultationId}/submit`, consultationData, token);
  },
  
  // Get all medical records for a consultation
  getConsultationMedicalRecords: async (consultationId: number, token: string): Promise<ApiResponse<MedicalRecordData[]>> => {
    return api.get<MedicalRecordData[]>(`/consultations/${consultationId}/medical-records`, token);
  },
  
  // Get all prescriptions for a consultation
  getConsultationPrescriptions: async (consultationId: number, token: string): Promise<ApiResponse<PrescriptionData[]>> => {
    return api.get<PrescriptionData[]>(`/consultations/${consultationId}/prescriptions`, token);
  },
  
  // Get all consultations for the authenticated doctor
  getMyConsultations: async (token: string, status?: string): Promise<ApiResponse<ConsultationData[]>> => {
    const endpoint = status ? `/consultations/doctor/my-consultations?status=${status}` : '/consultations/doctor/my-consultations';
    return api.get<ConsultationData[]>(endpoint, token);
  },

  // Get feedback for an appointment
  getFeedbackByAppointment: async (appointmentId: number, token: string): Promise<ApiResponse<FeedbackData>> => {
    return api.get<FeedbackData>(`/feedback/appointment/${appointmentId}`, token);
  },

  // Update doctor location
  updateLocation: async (
    locationData: LocationData,
    token: string
  ): Promise<ApiResponse<DoctorProfile>> => {
    return api.put<DoctorProfile>('/doctors/profile/location', locationData, token);
  },
  
  // Get nearby doctors based on speciality and location
  getNearbyDoctors: async (
    latitude: number,
    longitude: number,
    speciality?: string,
    maxDistance: number = 30, // Default 30km radius
    token?: string
  ): Promise<ApiResponse<DoctorWithDistanceData[]>> => {
    let endpoint = `/doctors/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`;
    
    if (speciality) {
      endpoint += `&specialty=${encodeURIComponent(speciality)}`;
    }
    
    return api.get<DoctorWithDistanceData[]>(endpoint, token);
  },
  
  // Get doctor's location
  getDoctorLocation: async (doctorId: number, token: string): Promise<ApiResponse<LocationData>> => {
    return api.get<LocationData>(`/doctors/${doctorId}/location`, token);
  },
};

export default doctorService;