import api from '../config/api';

export interface DoctorData {
  id: number;
  user_id: number;
  specialization: string;
  license_number: string;
  years_of_experience: number;
  education: string;
  bio: string;
  consultation_fee: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  rating?: number;
}

export interface NearbyDoctorData {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  availableToday: boolean;
  imageUrl: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class DoctorService {
  /**
   * Get all doctors with optional filter by specialization
   */
  async getAllDoctors(specialization?: string, limit = 20, offset = 0): Promise<ApiResponse<DoctorData[]>> {
    const params = { specialization, limit, offset };
    const response = await api.get('/api/doctors', { params });
    return response as ApiResponse<DoctorData[]>;
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(doctorId: number): Promise<ApiResponse<DoctorData>> {
    const response = await api.get(`/api/doctors/${doctorId}`);
    return response as ApiResponse<DoctorData>;
  }

  /**
   * Get nearby doctors based on user location
   */
  async getNearbyDoctors(params: {
    latitude?: number;
    longitude?: number;
    specialty?: string;
    maxDistance?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<DoctorData[]>> {
    const response = await api.get('/api/doctors/nearby', { params });
    return response as ApiResponse<DoctorData[]>;
  }

  /**
   * Get all valid specializations
   */
  async getSpecializations(): Promise<ApiResponse<string[]>> {
    // Updated to use the correct backend endpoint
    const response = await api.get('/api/doctors/specializations/list');
    return response as ApiResponse<string[]>;
  }

  /**
   * Find doctors based on symptom analysis specialties
   * @param specialty The medical specialty to search for
   */
  async findDoctorsBySpecialty(specialty: string): Promise<ApiResponse<DoctorData[]>> {
    try {
      if (!specialty) {
        throw new Error('Specialty is required');
      }
      
      // Call the new endpoint that finds doctors by specialty from symptom analysis
      const response = await api.get(`/api/appointments/find-doctors/${encodeURIComponent(specialty)}`);
      return response as ApiResponse<DoctorData[]>;
    } catch (error) {
      console.error('Error finding doctors by specialty:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to find doctors by specialty'
      };
    }
  }
}

export default new DoctorService();