import BaseApiService from './api/base-api.service';

export interface MedicalRecordData {
  id: number;
  consultation_id: number;
  patient_id: number;
  doctor_id: number;
  record_date: string;
  diagnosis: string;
  diagnosis_image_url: string | null;
  treatment_plan: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

class MedicalRecordService extends BaseApiService {
  constructor() {
    super('/api/medical-records'); // Fixed by adding the /api prefix
  }

  /**
   * Get medical records by appointment ID
   * @param appointmentId - Appointment ID
   */
  async getMedicalRecordsByAppointment(appointmentId: number) {
    try {
      // Use the direct endpoint that's implemented in the backend
      return await this.get(`/by-appointment/${appointmentId}`);
    } catch (error) {
      console.error('Error getting medical records by appointment:', error);
      return {
        success: false,
        message: 'Failed to load medical records',
        data: []
      };
    }
  }
  
  /**
   * Get a specific medical record by ID
   * @param recordId - Medical record ID
   */
  async getMedicalRecordById(recordId: number) {
    return await this.get(`/${recordId}`);
  }
}

export default new MedicalRecordService();