const { pool } = require('../config/database');
const Feedback = require('../models/feedback');
const PatientProfile = require('../models/patient-profile');
const DoctorProfile = require('../models/doctor-profile');
const User = require('../models/user');
const memoryStore = require('../utils/memoryStore');

/**
 * Feedback Repository - Handles feedback data access
 */
class FeedbackRepository {
    /**
     * Create a new feedback entry
     */
    async createFeedback(feedbackData) {
        try {
            const { 
                patient_id, 
                doctor_id, 
                appointment_id = null,
                rating,
                comment = ''
            } = feedbackData;
            
            const client = await pool.connect();
            
            try {
                console.log(`Creating feedback: Patient ID: ${patient_id}, Doctor ID: ${doctor_id}`);
                
                // Verify patient and doctor exist
                const patientResult = await client.query(
                    "SELECT 1 FROM patient_profiles WHERE id = $1",
                    [patient_id]
                );
                
                if (patientResult.rows.length === 0) {
                    throw new Error(`Patient with ID ${patient_id} not found`);
                }
                
                const doctorResult = await client.query(
                    "SELECT 1 FROM doctor_profiles WHERE id = $1",
                    [doctor_id]
                );
                
                if (doctorResult.rows.length === 0) {
                    throw new Error(`Doctor with ID ${doctor_id} not found`);
                }
                
                // Verify appointment exists if provided
                if (appointment_id) {
                    const appointmentResult = await client.query(
                        "SELECT 1 FROM appointments WHERE id = $1",
                        [appointment_id]
                    );
                    
                    if (appointmentResult.rows.length === 0) {
                        throw new Error(`Appointment with ID ${appointment_id} not found`);
                    }
                }
                
                // Create the feedback entry
                const result = await client.query(
                    `INSERT INTO feedback (
                        patient_id, doctor_id, appointment_id, 
                        rating, comment
                    ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [
                        patient_id, 
                        doctor_id, 
                        appointment_id,
                        rating,
                        comment
                    ]
                );
                
                return new Feedback(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._createFeedbackInMemory(feedbackData);
            }
            throw error;
        }
    }
    
    /**
     * Get feedback by ID
     */
    async getFeedbackById(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT f.*
                     FROM feedback f
                     WHERE f.id = $1`,
                    [id]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                return await this._populateFeedbackWithDetails(client, result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getFeedbackByIdInMemory(id);
            }
            throw error;
        }
    }
    
    /**
     * Get feedback for a doctor
     */
    async getDoctorFeedback(doctorId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT f.*
                     FROM feedback f
                     WHERE f.doctor_id = $1
                     ORDER BY f.created_at DESC`,
                    [doctorId]
                );
                
                if (result.rows.length === 0) {
                    return [];
                }
                
                return await this._populateFeedbackListWithDetails(client, result.rows);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getDoctorFeedbackInMemory(doctorId);
            }
            throw error;
        }
    }
    
    /**
     * Get feedback submitted by a patient
     */
    async getPatientFeedback(patientId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT f.*
                     FROM feedback f
                     WHERE f.patient_id = $1
                     ORDER BY f.created_at DESC`,
                    [patientId]
                );
                
                if (result.rows.length === 0) {
                    return [];
                }
                
                return await this._populateFeedbackListWithDetails(client, result.rows);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getPatientFeedbackInMemory(patientId);
            }
            throw error;
        }
    }
    
    /**
     * Update feedback
     */
    async updateFeedback(id, feedbackData) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if feedback exists
                const checkResult = await client.query(
                    'SELECT 1 FROM feedback WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Feedback with ID ${id} not found`);
                }
                
                const { 
                    rating,
                    comment
                } = feedbackData;
                
                const result = await client.query(
                    `UPDATE feedback SET
                        rating = COALESCE($1, rating),
                        comment = COALESCE($2, comment),
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $3
                     RETURNING *`,
                    [
                        rating,
                        comment,
                        id
                    ]
                );
                
                return new Feedback(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateFeedbackInMemory(id, feedbackData);
            }
            throw error;
        }
    }
    
    /**
     * Delete feedback
     */
    async deleteFeedback(id) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if feedback exists
                const checkResult = await client.query(
                    'SELECT 1 FROM feedback WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Feedback with ID ${id} not found`);
                }
                
                await client.query(
                    'DELETE FROM feedback WHERE id = $1',
                    [id]
                );
                
                return true;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._deleteFeedbackInMemory(id);
            }
            throw error;
        }
    }
    
    /**
     * Get average rating for a doctor
     */
    async getDoctorAverageRating(doctorId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
                     FROM feedback
                     WHERE doctor_id = $1`,
                    [doctorId]
                );
                
                const avgRating = parseFloat(result.rows[0].average_rating) || 0;
                const totalReviews = parseInt(result.rows[0].total_reviews) || 0;
                
                return {
                    average_rating: Number(avgRating.toFixed(1)),
                    total_reviews: totalReviews
                };
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getDoctorAverageRatingInMemory(doctorId);
            }
            throw error;
        }
    }
    
    /**
     * Helper method to populate feedback with doctor and patient details
     */
    async _populateFeedbackWithDetails(client, feedbackRow) {
        const feedback = new Feedback(feedbackRow);
        
        // Add patient details
        if (feedback.patient_id) {
            const patientResult = await client.query(
                `SELECT pp.*, 
                    u.id as user_id, u.email, u.first_name, u.last_name, 
                    u.role, u.phone
                 FROM patient_profiles pp
                 JOIN users u ON pp.user_id = u.id
                 WHERE pp.id = $1`,
                [feedback.patient_id]
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
                
                feedback.patient = patient;
            }
        }
        
        // Add doctor details
        if (feedback.doctor_id) {
            const doctorResult = await client.query(
                `SELECT dp.*, 
                    u.id as user_id, u.email, u.first_name, u.last_name, 
                    u.role, u.phone
                 FROM doctor_profiles dp
                 JOIN users u ON dp.user_id = u.id
                 WHERE dp.id = $1`,
                [feedback.doctor_id]
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
                
                feedback.doctor = doctor;
            }
        }
        
        return feedback;
    }
    
    /**
     * Helper method to populate a list of feedback with doctor and patient details
     */
    async _populateFeedbackListWithDetails(client, feedbackRows) {
        if (feedbackRows.length === 0) return [];
        
        // Get all patient and doctor IDs from the feedback
        const patientIds = [...new Set(feedbackRows.map(row => row.patient_id))];
        const doctorIds = [...new Set(feedbackRows.map(row => row.doctor_id))];
        
        // Fetch all patients in one query
        const patientsQuery = `
            SELECT pp.*, 
                u.id as user_id, u.email, u.first_name, u.last_name, 
                u.role, u.phone
            FROM patient_profiles pp
            JOIN users u ON pp.user_id = u.id
            WHERE pp.id = ANY($1)
        `;
        const patientsResult = await client.query(patientsQuery, [patientIds]);
        const patientsMap = new Map();
        
        patientsResult.rows.forEach(row => {
            const patient = new PatientProfile(row);
            patient.user = new User({
                id: row.user_id,
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                role: row.role,
                phone: row.phone
            });
            patientsMap.set(patient.id, patient);
        });
        
        // Fetch all doctors in one query
        const doctorsQuery = `
            SELECT dp.*, 
                u.id as user_id, u.email, u.first_name, u.last_name, 
                u.role, u.phone
            FROM doctor_profiles dp
            JOIN users u ON dp.user_id = u.id
            WHERE dp.id = ANY($1)
        `;
        const doctorsResult = await client.query(doctorsQuery, [doctorIds]);
        const doctorsMap = new Map();
        
        doctorsResult.rows.forEach(row => {
            const doctor = new DoctorProfile(row);
            doctor.user = new User({
                id: row.user_id,
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                role: row.role,
                phone: row.phone
            });
            doctorsMap.set(doctor.id, doctor);
        });
        
        // Create and populate feedback items
        return feedbackRows.map(row => {
            const feedback = new Feedback(row);
            feedback.patient = patientsMap.get(row.patient_id) || null;
            feedback.doctor = doctorsMap.get(row.doctor_id) || null;
            return feedback;
        });
    }

    /**
     * Helper method to check for connection errors
     */
    _isConnectionError(error) {
        return error.message.includes('connect ECONNREFUSED') || 
               error.message.includes('Connection terminated unexpectedly') ||
               error.message.includes('connection to server') ||
               error.message.includes('Connection refused');
    }

    /* IN-MEMORY STORAGE METHODS */
    
    /**
     * Create feedback in memory
     */
    _createFeedbackInMemory(feedbackData) {
        console.log(`Using in-memory storage for feedback creation`);
        
        const { 
            patient_id, 
            doctor_id, 
            appointment_id = null,
            rating,
            comment = ''
        } = feedbackData;
        
        // Check if patient exists in memory store
        const patientExists = memoryStore.patientProfiles.some(p => p.id === parseInt(patient_id));
        if (!patientExists) {
            throw new Error(`Patient with ID ${patient_id} not found`);
        }
        
        // Check if doctor exists in memory store
        const doctorExists = memoryStore.doctorProfiles.some(d => d.id === parseInt(doctor_id));
        if (!doctorExists) {
            throw new Error(`Doctor with ID ${doctor_id} not found`);
        }
        
        // Initialize feedback array if it doesn't exist
        if (!memoryStore.feedback) {
            memoryStore.feedback = [];
        }
        
        const newFeedback = {
            id: memoryStore.feedback.length + 1,
            patient_id: parseInt(patient_id),
            doctor_id: parseInt(doctor_id),
            appointment_id: appointment_id ? parseInt(appointment_id) : null,
            rating: rating,
            comment: comment,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        memoryStore.feedback.push(newFeedback);
        
        return this._getFeedbackByIdInMemory(newFeedback.id);
    }
    
    /**
     * Get feedback by ID from memory
     */
    _getFeedbackByIdInMemory(id) {
        if (!memoryStore.feedback) return null;
        
        const feedback = memoryStore.feedback.find(f => f.id === parseInt(id));
        if (!feedback) return null;
        
        const result = new Feedback(feedback);
        
        // Add related patient data
        const patient = memoryStore.patientProfiles.find(p => p.id === feedback.patient_id);
        if (patient) {
            const patientUser = memoryStore.users.find(u => u.id === patient.user_id);
            if (patientUser) {
                const patientProfile = new PatientProfile(patient);
                patientProfile.user = new User(patientUser);
                result.patient = patientProfile;
            }
        }
        
        // Add related doctor data
        const doctor = memoryStore.doctorProfiles.find(d => d.id === feedback.doctor_id);
        if (doctor) {
            const doctorUser = memoryStore.users.find(u => u.id === doctor.user_id);
            if (doctorUser) {
                const doctorProfile = new DoctorProfile(doctor);
                doctorProfile.user = new User(doctorUser);
                result.doctor = doctorProfile;
            }
        }
        
        return result;
    }
    
    /**
     * Get doctor feedback from memory
     */
    _getDoctorFeedbackInMemory(doctorId) {
        if (!memoryStore.feedback) return [];
        
        const feedbackList = memoryStore.feedback.filter(f => f.doctor_id === parseInt(doctorId));
        
        // Sort by created_at descending
        feedbackList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        return feedbackList.map(feedback => {
            const result = new Feedback(feedback);
            
            // Add related patient data
            const patient = memoryStore.patientProfiles.find(p => p.id === feedback.patient_id);
            if (patient) {
                const patientUser = memoryStore.users.find(u => u.id === patient.user_id);
                if (patientUser) {
                    const patientProfile = new PatientProfile(patient);
                    patientProfile.user = new User(patientUser);
                    result.patient = patientProfile;
                }
            }
            
            // Add related doctor data
            const doctor = memoryStore.doctorProfiles.find(d => d.id === feedback.doctor_id);
            if (doctor) {
                const doctorUser = memoryStore.users.find(u => u.id === doctor.user_id);
                if (doctorUser) {
                    const doctorProfile = new DoctorProfile(doctor);
                    doctorProfile.user = new User(doctorUser);
                    result.doctor = doctorProfile;
                }
            }
            
            return result;
        });
    }
    
    /**
     * Get patient feedback from memory
     */
    _getPatientFeedbackInMemory(patientId) {
        if (!memoryStore.feedback) return [];
        
        const feedbackList = memoryStore.feedback.filter(f => f.patient_id === parseInt(patientId));
        
        // Sort by created_at descending
        feedbackList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        return feedbackList.map(feedback => {
            const result = new Feedback(feedback);
            
            // Add related patient data
            const patient = memoryStore.patientProfiles.find(p => p.id === feedback.patient_id);
            if (patient) {
                const patientUser = memoryStore.users.find(u => u.id === patient.user_id);
                if (patientUser) {
                    const patientProfile = new PatientProfile(patient);
                    patientProfile.user = new User(patientUser);
                    result.patient = patientProfile;
                }
            }
            
            // Add related doctor data
            const doctor = memoryStore.doctorProfiles.find(d => d.id === feedback.doctor_id);
            if (doctor) {
                const doctorUser = memoryStore.users.find(u => u.id === doctor.user_id);
                if (doctorUser) {
                    const doctorProfile = new DoctorProfile(doctor);
                    doctorProfile.user = new User(doctorUser);
                    result.doctor = doctorProfile;
                }
            }
            
            return result;
        });
    }
    
    /**
     * Update feedback in memory
     */
    _updateFeedbackInMemory(id, feedbackData) {
        if (!memoryStore.feedback) throw new Error(`Feedback with ID ${id} not found`);
        
        const index = memoryStore.feedback.findIndex(f => f.id === parseInt(id));
        if (index === -1) throw new Error(`Feedback with ID ${id} not found`);
        
        const oldFeedback = memoryStore.feedback[index];
        const updatedFeedback = {
            ...oldFeedback,
            rating: feedbackData.rating !== undefined ? feedbackData.rating : oldFeedback.rating,
            comment: feedbackData.comment !== undefined ? feedbackData.comment : oldFeedback.comment,
            updated_at: new Date()
        };
        
        memoryStore.feedback[index] = updatedFeedback;
        
        return this._getFeedbackByIdInMemory(id);
    }
    
    /**
     * Delete feedback in memory
     */
    _deleteFeedbackInMemory(id) {
        if (!memoryStore.feedback) return false;
        
        const index = memoryStore.feedback.findIndex(f => f.id === parseInt(id));
        if (index === -1) return false;
        
        memoryStore.feedback.splice(index, 1);
        return true;
    }
    
    /**
     * Get doctor average rating from memory
     */
    _getDoctorAverageRatingInMemory(doctorId) {
        if (!memoryStore.feedback) {
            return { average_rating: 0, total_reviews: 0 };
        }
        
        const doctorFeedback = memoryStore.feedback.filter(f => f.doctor_id === parseInt(doctorId));
        
        if (doctorFeedback.length === 0) {
            return { average_rating: 0, total_reviews: 0 };
        }
        
        const totalRating = doctorFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
        const averageRating = totalRating / doctorFeedback.length;
        
        return {
            average_rating: Number(averageRating.toFixed(1)),
            total_reviews: doctorFeedback.length
        };
    }
}

module.exports = new FeedbackRepository();