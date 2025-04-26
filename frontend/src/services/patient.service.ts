import api from '../config/api';

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
    const response = await api.get('/api/patients/profile/me');
    return response as ApiResponse<PatientProfileData>;
  }

  /**
   * Update the profile of the authenticated patient
   */
  async updateProfile(profileData: PatientProfileUpdateData): Promise<ApiResponse<PatientProfileData>> {
    const response = await api.put('/api/patients/profile/me', profileData);
    return response as ApiResponse<PatientProfileData>;
  }

  /**
   * Get dashboard statistics and information for the patient
   */
  async getDashboardData(): Promise<ApiResponse<PatientDashboardData>> {
    const response = await api.get('/api/patients/dashboard');
    return response as ApiResponse<PatientDashboardData>;
  }

  /**
   * Get medical records for the authenticated patient
   */
  async getMedicalRecords(): Promise<ApiResponse<any[]>> {
    const response = await api.get('/api/patients/medical-records');
    return response as ApiResponse<any[]>;
  }

  /**
   * Get a specific medical record by ID
   */
  async getMedicalRecordById(recordId: number): Promise<ApiResponse<any>> {
    const response = await api.get(`/api/patients/medical-records/${recordId}`);
    return response as ApiResponse<any>;
  }
}

export default new PatientService();