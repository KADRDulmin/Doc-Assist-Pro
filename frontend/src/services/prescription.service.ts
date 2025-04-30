import BaseApiService from './api/base-api.service';
import { ApiResponse } from './api/api-response.type';

export interface PrescriptionData {
  id: number;
  consultation_id: number;
  patient_id: number;
  doctor_id: number;
  prescription_date: string;
  prescription_text: string;
  prescription_image_url?: string;
  status: string;
  duration_days?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  doctor?: any;
  patient?: any;
  consultation?: any;
}

class PrescriptionService extends BaseApiService {
  constructor() {
    super('/api/prescriptions'); // Fixed to include /api prefix
  }

  /**
   * Get prescriptions by patient
   */
  async getPrescriptionsByPatient(): Promise<ApiResponse<PrescriptionData[]>> {
    return this.get('/my-prescriptions');
  }

  /**
   * Get prescriptions by appointment ID
   * @param appointmentId - Appointment ID
   */
  async getPrescriptionsByAppointment(appointmentId: number): Promise<ApiResponse<PrescriptionData[]>> {
    return this.get(`/by-appointment/${appointmentId}`); // Fixed incorrect endpoint path
  }

  /**
   * Get a specific prescription by ID
   * @param id - Prescription ID
   */
  async getPrescriptionById(id: number): Promise<ApiResponse<PrescriptionData>> {
    return this.get(`/${id}`);
  }
}

export default new PrescriptionService();