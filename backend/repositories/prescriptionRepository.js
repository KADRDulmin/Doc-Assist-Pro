/**
 * Prescription Repository
 * Handles database operations for prescriptions
 */

const { pool } = require('../config/database');
const Prescription = require('../models/prescription');
const User = require('../models/user');
const PatientProfile = require('../models/patient-profile');
const DoctorProfile = require('../models/doctor-profile');
const { saveBase64Image, deleteImage } = require('../utils/fileStorage');

class PrescriptionRepository {
    /**
     * Create a new prescription
     * @param {Object} prescriptionData - Prescription data
     * @returns {Promise<Prescription>} Created prescription
     */
    async createPrescription(prescriptionData) {
        try {
            const {
                consultation_id,
                patient_id,
                doctor_id,
                prescription_text,
                prescription_image_url,
                status = 'active',
                duration_days,
                notes
            } = prescriptionData;
            
            const prescription_date = prescriptionData.prescription_date || new Date();
            
            const client = await pool.connect();
            
            try {
                console.log(`Creating prescription for consultation ID: ${consultation_id}`);
                
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
                
                // Validate that either prescription_text or prescription_image_url is provided
                if (!prescription_text && !prescription_image_url) {
                    throw new Error('Either prescription text or image URL must be provided');
                }
                
                // Process image if provided (convert base64 to file)
                let savedImageUrl = null;
                if (prescription_image_url && prescription_image_url.startsWith('data:image')) {
                    savedImageUrl = saveBase64Image(prescription_image_url, 'prescription');
                } else if (prescription_image_url) {
                    savedImageUrl = prescription_image_url; // Keep existing URL if not base64
                }
                
                const result = await client.query(
                    `INSERT INTO prescriptions (
                        consultation_id, patient_id, doctor_id, prescription_date,
                        prescription_text, prescription_image_url, status, duration_days, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                    [
                        consultation_id,
                        patient_id,
                        doctor_id,
                        prescription_date,
                        prescription_text || '',
                        savedImageUrl,
                        status,
                        duration_days || null,
                        notes || ''
                    ]
                );
                
                return new Prescription(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error creating prescription:', error);
            throw error;
        }
    }

    /**
     * Get prescription by ID with related data
     * @param {number} id - Prescription ID
     * @returns {Promise<Prescription|null>} Prescription with related data or null if not found
     */
    async getPrescriptionById(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT p.*
                     FROM prescriptions p
                     WHERE p.id = $1`,
                    [id]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                const prescription = new Prescription(result.rows[0]);
                
                // Fetch patient information
                const patientResult = await client.query(
                    `SELECT pp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM patient_profiles pp
                     JOIN users u ON pp.user_id = u.id
                     WHERE pp.id = $1`,
                    [prescription.patient_id]
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
                    
                    prescription.patient = patient;
                }
                
                // Fetch doctor information
                const doctorResult = await client.query(
                    `SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE dp.id = $1`,
                    [prescription.doctor_id]
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
                    
                    prescription.doctor = doctor;
                }
                
                return prescription;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting prescription by ID:', error);
            throw error;
        }
    }

    /**
     * Get prescriptions by consultation ID
     * @param {number} consultationId - Consultation ID
     * @returns {Promise<Array<Prescription>>} List of prescriptions
     */
    async getPrescriptionsByConsultationId(consultationId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT p.*
                     FROM prescriptions p
                     WHERE p.consultation_id = $1
                     ORDER BY p.prescription_date DESC`,
                    [consultationId]
                );
                
                if (result.rows.length === 0) {
                    return [];
                }
                
                return Promise.all(result.rows.map(async (row) => {
                    return this.getPrescriptionById(row.id);
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting prescriptions by consultation ID:', error);
            throw error;
        }
    }

    /**
     * Get all active prescriptions for a patient
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<Prescription>>} List of active prescriptions
     */
    async getPatientActivePrescriptions(patientId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT p.*
                     FROM prescriptions p
                     WHERE p.patient_id = $1 AND p.status = 'active'
                     ORDER BY p.prescription_date DESC`,
                    [patientId]
                );
                
                return Promise.all(result.rows.map(async (row) => {
                    return this.getPrescriptionById(row.id);
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting patient active prescriptions:', error);
            throw error;
        }
    }

    /**
     * Get all prescriptions for a patient
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<Prescription>>} List of prescriptions
     */
    async getPatientPrescriptions(patientId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT p.*
                     FROM prescriptions p
                     WHERE p.patient_id = $1
                     ORDER BY p.prescription_date DESC`,
                    [patientId]
                );
                
                return Promise.all(result.rows.map(async (row) => {
                    return this.getPrescriptionById(row.id);
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting patient prescriptions:', error);
            throw error;
        }
    }

    /**
     * Update a prescription
     * @param {number} id - Prescription ID
     * @param {Object} prescriptionData - Updated prescription data
     * @returns {Promise<Prescription>} Updated prescription
     */
    async updatePrescription(id, prescriptionData) {
        try {
            const client = await pool.connect();
            
            try {
                const {
                    prescription_text,
                    prescription_image_url,
                    status,
                    duration_days,
                    notes
                } = prescriptionData;
                
                // Get current prescription to check if we need to delete an image
                const currentResult = await client.query(
                    'SELECT prescription_image_url FROM prescriptions WHERE id = $1',
                    [id]
                );
                
                if (currentResult.rows.length === 0) {
                    throw new Error(`Prescription with ID ${id} not found`);
                }
                
                // Process image if provided
                let savedImageUrl = currentResult.rows[0].prescription_image_url;
                if (prescription_image_url && prescription_image_url.startsWith('data:image')) {
                    // Delete old image if exists
                    if (savedImageUrl) {
                        deleteImage(savedImageUrl);
                    }
                    
                    // Save new image
                    savedImageUrl = saveBase64Image(prescription_image_url, 'prescription');
                } else if (prescription_image_url) {
                    savedImageUrl = prescription_image_url; // Keep existing URL if not base64
                }
                
                const result = await client.query(
                    `UPDATE prescriptions SET
                        prescription_text = COALESCE($1, prescription_text),
                        prescription_image_url = COALESCE($2, prescription_image_url),
                        status = COALESCE($3, status),
                        duration_days = COALESCE($4, duration_days),
                        notes = COALESCE($5, notes),
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $6
                     RETURNING *`,
                    [prescription_text, savedImageUrl, status, duration_days, notes, id]
                );
                
                if (result.rows.length === 0) {
                    throw new Error(`Prescription with ID ${id} not found`);
                }
                
                return new Prescription(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error updating prescription:', error);
            throw error;
        }
    }

    /**
     * Delete a prescription
     * @param {number} id - Prescription ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async deletePrescription(id) {
        try {
            const client = await pool.connect();
            
            try {
                // Get current prescription to check if we need to delete an image
                const currentResult = await client.query(
                    'SELECT prescription_image_url FROM prescriptions WHERE id = $1',
                    [id]
                );
                
                if (currentResult.rows.length === 0) {
                    throw new Error(`Prescription with ID ${id} not found`);
                }
                
                // Delete image file if exists
                if (currentResult.rows[0].prescription_image_url) {
                    deleteImage(currentResult.rows[0].prescription_image_url);
                }
                
                // Delete prescription from database
                await client.query(
                    'DELETE FROM prescriptions WHERE id = $1',
                    [id]
                );
                
                return true;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error deleting prescription:', error);
            throw error;
        }
    }
}

module.exports = new PrescriptionRepository();