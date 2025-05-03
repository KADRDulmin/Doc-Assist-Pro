/**
 * Consultation Repository
 * Handles database operations for consultations
 */

const { pool } = require('../config/database');
const Consultation = require('../models/consultation');
const MedicalRecord = require('../models/medical-record');
const Prescription = require('../models/prescription');
const User = require('../models/user');
const PatientProfile = require('../models/patient-profile');
const DoctorProfile = require('../models/doctor-profile');

class ConsultationRepository {
    /**
     * Create a new consultation
     * @param {Object} consultationData - Consultation data
     * @returns {Promise<Consultation>} Created consultation
     */
    async createConsultation(consultationData) {
        try {
            const {
                appointment_id,
                doctor_id,
                patient_id,
                status = 'in_progress',
                actual_start_time = new Date()
            } = consultationData;
            
            const client = await pool.connect();
            
            try {
                console.log(`Creating consultation for appointment ID: ${appointment_id}`);
                
                // Verify appointment, doctor and patient exist
                const appointmentResult = await client.query(
                    "SELECT 1 FROM appointments WHERE id = $1",
                    [appointment_id]
                );
                
                if (appointmentResult.rows.length === 0) {
                    throw new Error(`Appointment with ID ${appointment_id} not found`);
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
                
                // Check if a consultation already exists for this appointment
                const existingConsultation = await client.query(
                    "SELECT 1 FROM consultations WHERE appointment_id = $1",
                    [appointment_id]
                );
                
                if (existingConsultation.rows.length > 0) {
                    throw new Error(`A consultation already exists for appointment ID ${appointment_id}`);
                }
                
                const result = await client.query(
                    `INSERT INTO consultations (
                        appointment_id, doctor_id, patient_id, status, actual_start_time
                    ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [
                        appointment_id,
                        doctor_id,
                        patient_id,
                        status,
                        actual_start_time
                    ]
                );
                
                return new Consultation(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error creating consultation:', error);
            throw error;
        }
    }

    /**
     * Get consultation by ID with related data
     * @param {number} id - Consultation ID
     * @returns {Promise<Consultation|null>} Consultation with related data or null if not found
     */
    async getConsultationById(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT c.*
                     FROM consultations c
                     WHERE c.id = $1`,
                    [id]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                const consultation = new Consultation(result.rows[0]);
                
                // Load the related appointment
                const appointmentResult = await client.query(
                    `SELECT a.*
                     FROM appointments a
                     WHERE a.id = $1`,
                    [consultation.appointment_id]
                );
                
                if (appointmentResult.rows.length > 0) {
                    consultation.appointment = appointmentResult.rows[0];
                }
                
                // Fetch patient information
                const patientResult = await client.query(
                    `SELECT pp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM patient_profiles pp
                     JOIN users u ON pp.user_id = u.id
                     WHERE pp.id = $1`,
                    [consultation.patient_id]
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
                    
                    consultation.patient = patient;
                }
                
                // Fetch doctor information
                const doctorResult = await client.query(
                    `SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE dp.id = $1`,
                    [consultation.doctor_id]
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
                    
                    consultation.doctor = doctor;
                }
                
                // Load medical records
                const medicalRecordsResult = await client.query(
                    `SELECT *
                     FROM medical_records
                     WHERE consultation_id = $1`,
                    [id]
                );
                
                if (medicalRecordsResult.rows.length > 0) {
                    consultation.medical_records = medicalRecordsResult.rows.map(row => new MedicalRecord(row));
                }
                
                // Load prescriptions
                const prescriptionsResult = await client.query(
                    `SELECT *
                     FROM prescriptions
                     WHERE consultation_id = $1`,
                    [id]
                );
                
                if (prescriptionsResult.rows.length > 0) {
                    consultation.prescriptions = prescriptionsResult.rows.map(row => new Prescription(row));
                }
                
                return consultation;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting consultation by ID:', error);
            throw error;
        }
    }

    /**
     * Get consultation by appointment ID
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Consultation|null>} Consultation or null if not found
     */
    async getConsultationByAppointmentId(appointmentId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT c.*
                     FROM consultations c
                     WHERE c.appointment_id = $1`,
                    [appointmentId]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                return this.getConsultationById(result.rows[0].id);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting consultation by appointment ID:', error);
            throw error;
        }
    }

    /**
     * Update consultation status
     * @param {number} id - Consultation ID
     * @param {string} status - New status
     * @param {Date} [endTime] - End time for completed consultations
     * @returns {Promise<Consultation>} Updated consultation
     */
    async updateConsultationStatus(id, status, endTime = null) {
        try {
            const client = await pool.connect();
            
            try {
                let result;
                
                if (status === 'completed' && endTime) {
                    result = await client.query(
                        `UPDATE consultations SET
                            status = $1,
                            actual_end_time = $2,
                            updated_at = CURRENT_TIMESTAMP
                         WHERE id = $3
                         RETURNING *`,
                        [status, endTime, id]
                    );
                } else {
                    result = await client.query(
                        `UPDATE consultations SET
                            status = $1,
                            updated_at = CURRENT_TIMESTAMP
                         WHERE id = $2
                         RETURNING *`,
                        [status, id]
                    );
                }
                
                if (result.rows.length === 0) {
                    throw new Error(`Consultation with ID ${id} not found`);
                }
                
                return new Consultation(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error updating consultation status:', error);
            throw error;
        }
    }

    /**
     * Complete a consultation and its associated appointment
     * @param {number} id - Consultation ID
     * @returns {Promise<Consultation>} Completed consultation
     */
    async completeConsultation(id) {
        try {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Get the consultation to find the appointment_id
                const consultationResult = await client.query(
                    `SELECT * FROM consultations WHERE id = $1`,
                    [id]
                );
                
                if (consultationResult.rows.length === 0) {
                    throw new Error(`Consultation with ID ${id} not found`);
                }
                
                const appointmentId = consultationResult.rows[0].appointment_id;
                
                // Update the consultation status
                const endTime = new Date();
                const updatedConsultationResult = await client.query(
                    `UPDATE consultations SET
                        status = 'completed',
                        actual_end_time = $1,
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $2
                     RETURNING *`,
                    [endTime, id]
                );
                
                // Update the appointment status
                await client.query(
                    `UPDATE appointments SET
                        status = 'completed',
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [appointmentId]
                );
                
                await client.query('COMMIT');
                
                return new Consultation(updatedConsultationResult.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error completing consultation:', error);
            throw error;
        }
    }

    /**
     * Mark a consultation as missed and update the associated appointment
     * @param {number} id - Consultation ID
     * @returns {Promise<Consultation>} Missed consultation
     */
    async markConsultationAsMissed(id) {
        try {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Get the consultation to find the appointment_id
                const consultationResult = await client.query(
                    `SELECT * FROM consultations WHERE id = $1`,
                    [id]
                );
                
                if (consultationResult.rows.length === 0) {
                    throw new Error(`Consultation with ID ${id} not found`);
                }
                
                const appointmentId = consultationResult.rows[0].appointment_id;
                
                // Update the consultation status
                const updatedConsultationResult = await client.query(
                    `UPDATE consultations SET
                        status = 'missed',
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1
                     RETURNING *`,
                    [id]
                );
                
                // Update the appointment status
                await client.query(
                    `UPDATE appointments SET
                        status = 'missed',
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [appointmentId]
                );
                
                await client.query('COMMIT');
                
                return new Consultation(updatedConsultationResult.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error marking consultation as missed:', error);
            throw error;
        }
    }

    /**
     * Get all consultations for a doctor
     * @param {number} doctorId - Doctor ID
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array<Consultation>>} List of consultations
     */
    async getDoctorConsultations(doctorId, filters = {}) {
        try {
            const client = await pool.connect();
            
            try {
                let query = `
                    SELECT c.*
                    FROM consultations c
                    WHERE c.doctor_id = $1
                `;
                
                const queryParams = [doctorId];
                let paramIndex = 2;
                
                // Add status filter
                if (filters.status) {
                    query += ` AND c.status = $${paramIndex}`;
                    queryParams.push(filters.status);
                    paramIndex++;
                }
                
                // Add date filter
                if (filters.date) {
                    const date = new Date(filters.date);
                    query += ` AND DATE(c.actual_start_time) = $${paramIndex}`;
                    queryParams.push(date);
                    paramIndex++;
                }
                
                query += ' ORDER BY c.actual_start_time DESC';
                
                const result = await client.query(query, queryParams);
                
                return Promise.all(result.rows.map(async (row) => {
                    return this.getConsultationById(row.id);
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting doctor consultations:', error);
            throw error;
        }
    }

    /**
     * Get all consultations for a patient
     * @param {number} patientId - Patient ID
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array<Consultation>>} List of consultations
     */
    async getPatientConsultations(patientId, filters = {}) {
        try {
            const client = await pool.connect();
            
            try {
                let query = `
                    SELECT c.*
                    FROM consultations c
                    WHERE c.patient_id = $1
                `;
                
                const queryParams = [patientId];
                let paramIndex = 2;
                
                // Add status filter
                if (filters.status) {
                    query += ` AND c.status = $${paramIndex}`;
                    queryParams.push(filters.status);
                    paramIndex++;
                }
                
                query += ' ORDER BY c.actual_start_time DESC';
                
                const result = await client.query(query, queryParams);
                
                return Promise.all(result.rows.map(async (row) => {
                    return this.getConsultationById(row.id);
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting patient consultations:', error);
            throw error;
        }
    }
}

module.exports = new ConsultationRepository();