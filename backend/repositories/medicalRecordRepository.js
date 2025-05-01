/**
 * Medical Record Repository
 * Handles database operations for medical records
 */

const { pool } = require('../config/database');
const MedicalRecord = require('../models/medical-record');
const User = require('../models/user');
const PatientProfile = require('../models/patient-profile');
const DoctorProfile = require('../models/doctor-profile');
const { saveBase64Image, deleteImage } = require('../utils/fileStorage');

class MedicalRecordRepository {
    /**
     * Create a new medical record
     * @param {Object} recordData - Medical record data
     * @returns {Promise<MedicalRecord>} Created medical record
     */
    async createMedicalRecord(recordData) {
        try {
            const {
                consultation_id,
                patient_id,
                doctor_id,
                diagnosis,
                diagnosis_image_url,
                treatment_plan,
                notes
            } = recordData;
            
            const record_date = recordData.record_date || new Date();
            
            const client = await pool.connect();
            
            try {
                console.log(`Creating medical record for consultation ID: ${consultation_id}`);
                
                // Verify consultation, doctor and patient exist
                const consultationResult = await client.query(
                    "SELECT 1 FROM consultations WHERE id = $1",
                    [consultation_id]
                );
                
                if (consultationResult.rows.length === 0) {
                    throw new Error(`Consultation with ID ${consultation_id} not found`);
                }
                
                const doctorResult = await client.query(
                    "SELECT 1 FROM doctor_profiles WHERE id = $1",
                    [doctor_id]
                );
                
                if (doctorResult.rows.length === 0) {
                    throw new Error(`Doctor with ID ${doctor_id} not found`);
                }
                
                const patientResult = await client.query(
                    "SELECT 1 FROM patient_profiles WHERE id = $1",
                    [patient_id]
                );
                
                if (patientResult.rows.length === 0) {
                    throw new Error(`Patient with ID ${patient_id} not found`);
                }
                
                // Process image if provided (convert base64 to file)
                let savedImageUrl = null;
                if (diagnosis_image_url && diagnosis_image_url.startsWith('data:image')) {
                    savedImageUrl = saveBase64Image(diagnosis_image_url, 'medical_record');
                } else if (diagnosis_image_url) {
                    savedImageUrl = diagnosis_image_url; // Keep existing URL if not base64
                }
                
                const result = await client.query(
                    `INSERT INTO medical_records (
                        consultation_id, patient_id, doctor_id, record_date,
                        diagnosis, diagnosis_image_url, treatment_plan, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                    [
                        consultation_id,
                        patient_id,
                        doctor_id,
                        record_date,
                        diagnosis || '',
                        savedImageUrl,
                        treatment_plan || '',
                        notes || ''
                    ]
                );
                
                return new MedicalRecord(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error creating medical record:', error);
            throw error;
        }
    }

    /**
     * Get medical record by ID with related data
     * @param {number} id - Medical record ID
     * @returns {Promise<MedicalRecord|null>} Medical record with related data or null if not found
     */
    async getMedicalRecordById(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT mr.*
                     FROM medical_records mr
                     WHERE mr.id = $1`,
                    [id]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                const medicalRecord = new MedicalRecord(result.rows[0]);
                
                // Fetch patient information
                const patientResult = await client.query(
                    `SELECT pp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM patient_profiles pp
                     JOIN users u ON pp.user_id = u.id
                     WHERE pp.id = $1`,
                    [medicalRecord.patient_id]
                );
                
                if (patientResult.rows.length > 0) {
                    const patientRow = patientResult.rows[0];
                    const patient = new PatientProfile(patientRow);
                    
                    patient.user = new User({
                        id: patientRow.user_id,
                        email: patientRow.email,
                        first_name: patientRow.first_name,
                        last_name: patientRow.last_name,
                        role: patientRow.role,
                        phone: patientRow.phone
                    });
                    
                    medicalRecord.patient = patient;
                }
                
                // Fetch doctor information
                const doctorResult = await client.query(
                    `SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE dp.id = $1`,
                    [medicalRecord.doctor_id]
                );
                
                if (doctorResult.rows.length > 0) {
                    const doctorRow = doctorResult.rows[0];
                    const doctor = new DoctorProfile(doctorRow);
                    
                    doctor.user = new User({
                        id: doctorRow.user_id,
                        email: doctorRow.email,
                        first_name: doctorRow.first_name,
                        last_name: doctorRow.last_name,
                        role: doctorRow.role,
                        phone: doctorRow.phone
                    });
                    
                    medicalRecord.doctor = doctor;
                }
                
                return medicalRecord;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting medical record by ID:', error);
            throw error;
        }
    }

    /**
     * Get medical records by consultation ID
     * @param {number} consultationId - Consultation ID
     * @returns {Promise<Array<MedicalRecord>>} List of medical records
     */
    async getMedicalRecordsByConsultationId(consultationId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT mr.*
                     FROM medical_records mr
                     WHERE mr.consultation_id = $1
                     ORDER BY mr.record_date DESC`,
                    [consultationId]
                );
                
                if (result.rows.length === 0) {
                    return [];
                }
                
                return Promise.all(result.rows.map(async (row) => {
                    return this.getMedicalRecordById(row.id);
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting medical records by consultation ID:', error);
            throw error;
        }
    }

    /**
     * Get all medical records for a patient
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<MedicalRecord>>} List of medical records
     */
    async getPatientMedicalRecords(patientId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT mr.*
                     FROM medical_records mr
                     WHERE mr.patient_id = $1
                     ORDER BY mr.record_date DESC`,
                    [patientId]
                );
                
                return Promise.all(result.rows.map(async (row) => {
                    return this.getMedicalRecordById(row.id);
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting patient medical records:', error);
            throw error;
        }
    }

    /**
     * Update a medical record
     * @param {number} id - Medical record ID
     * @param {Object} recordData - Updated medical record data
     * @returns {Promise<MedicalRecord>} Updated medical record
     */
    async updateMedicalRecord(id, recordData) {
        try {
            const client = await pool.connect();
            
            try {
                const {
                    diagnosis,
                    diagnosis_image_url,
                    treatment_plan,
                    notes
                } = recordData;
                
                // Get current medical record to check if we need to delete an image
                const currentResult = await client.query(
                    'SELECT diagnosis_image_url FROM medical_records WHERE id = $1',
                    [id]
                );
                
                if (currentResult.rows.length === 0) {
                    throw new Error(`Medical record with ID ${id} not found`);
                }
                
                // Process image if provided
                let savedImageUrl = currentResult.rows[0].diagnosis_image_url;
                if (diagnosis_image_url && diagnosis_image_url.startsWith('data:image')) {
                    // Delete old image if exists
                    if (savedImageUrl) {
                        deleteImage(savedImageUrl);
                    }
                    
                    // Save new image
                    savedImageUrl = saveBase64Image(diagnosis_image_url, 'medical_record');
                } else if (diagnosis_image_url) {
                    savedImageUrl = diagnosis_image_url; // Keep existing URL if not base64
                }
                
                const result = await client.query(
                    `UPDATE medical_records SET
                        diagnosis = COALESCE($1, diagnosis),
                        diagnosis_image_url = COALESCE($2, diagnosis_image_url),
                        treatment_plan = COALESCE($3, treatment_plan),
                        notes = COALESCE($4, notes),
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $5
                     RETURNING *`,
                    [diagnosis, savedImageUrl, treatment_plan, notes, id]
                );
                
                if (result.rows.length === 0) {
                    throw new Error(`Medical record with ID ${id} not found`);
                }
                
                return new MedicalRecord(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error updating medical record:', error);
            throw error;
        }
    }

    /**
     * Delete a medical record
     * @param {number} id - Medical record ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async deleteMedicalRecord(id) {
        try {
            const client = await pool.connect();
            
            try {
                // Get current medical record to check if we need to delete an image
                const currentResult = await client.query(
                    'SELECT diagnosis_image_url FROM medical_records WHERE id = $1',
                    [id]
                );
                
                if (currentResult.rows.length === 0) {
                    throw new Error(`Medical record with ID ${id} not found`);
                }
                
                // Delete image file if exists
                if (currentResult.rows[0].diagnosis_image_url) {
                    deleteImage(currentResult.rows[0].diagnosis_image_url);
                }
                
                // Delete record from database
                await client.query(
                    'DELETE FROM medical_records WHERE id = $1',
                    [id]
                );
                
                return true;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error deleting medical record:', error);
            throw error;
        }
    }
}

module.exports = new MedicalRecordRepository();