import BaseApiService from './api/base-api.service';
import { ApiResponse } from './api/api-response.type';
import { MedicalRecordData } from './appointment.service';

class MedicalRecordService extends BaseApiService {
  constructor() {
    super('/api/medical-records'); // Fixed to include /api prefix
  }

  async getMedicalRecordsByAppointment(appointmentId: number): Promise<ApiResponse<MedicalRecordData[]>> {
    return this.get(`/by-appointment/${appointmentId}`);
  }

  async getMedicalRecordsByConsultation(consultationId: number): Promise<ApiResponse<MedicalRecordData[]>> {
    return this.get(`/by-consultation/${consultationId}`);
  }

  async getMedicalRecordById(id: number): Promise<ApiResponse<MedicalRecordData>> {
    return this.get(`/${id}`);
  }

  async createMedicalRecord(medicalRecordData: any): Promise<ApiResponse<MedicalRecordData>> {
    return this.post('', medicalRecordData);
  }

  async updateMedicalRecord(id: number, medicalRecordData: any): Promise<ApiResponse<MedicalRecordData>> {
    return this.put(`/${id}`, medicalRecordData);
  }

  async deleteMedicalRecord(id: number): Promise<ApiResponse<any>> {
    return this.delete(`/${id}`);
  }

  async getPatientMedicalHistory(patientId: number): Promise<ApiResponse<MedicalRecordData[]>> {
    return this.get(`/patient/${patientId}/history`);
  }
}

export default new MedicalRecordService();