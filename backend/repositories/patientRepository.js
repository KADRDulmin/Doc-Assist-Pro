const { pool } = require('../config/database');
const PatientProfile = require('../models/patient-profile');
const User = require('../models/user');
const memoryStore = require('../utils/memoryStore');

/**
 * Patient Repository - Handles patient profile data access
 */
class PatientRepository {
    /**
     * Create a patient profile
     */
    async createProfile(userId, profileData) {
        try {
            const { 
                date_of_birth, 
                gender, 
                blood_group,
                allergies = '',
                medical_history = '',
                emergency_contact_name = '',
                emergency_contact_phone = ''
            } = profileData;
            
            const client = await pool.connect();
            
            try {
                console.log(`Creating patient profile for user ID: ${userId}`);
                
                // Make sure the user exists and is a patient
                const userResult = await client.query(
                    "SELECT * FROM users WHERE id = $1 AND role = 'patient'",
                    [userId]
                );
                
                if (userResult.rows.length === 0) {
                    throw new Error(`No patient user found with ID ${userId}`);
                }
                
                const result = await client.query(
                    `INSERT INTO patient_profiles (
                        user_id, date_of_birth, gender, blood_group, 
                        allergies, medical_history, 
                        emergency_contact_name, emergency_contact_phone
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                    [
                        userId, 
                        date_of_birth, 
                        gender, 
                        blood_group, 
                        allergies, 
                        medical_history,
                        emergency_contact_name,
                        emergency_contact_phone
                    ]
                );
                
                const profile = new PatientProfile(result.rows[0]);
                profile.user = new User(userResult.rows[0]);
                
                return profile;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._createProfileInMemory(userId, profileData);
            }
            
            throw error;
        }
    }
    
    /**
     * Get patient profile by user ID
     */
    async getProfileByUserId(userId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT pp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone, u.is_active, u.is_verified
                     FROM patient_profiles pp
                     JOIN users u ON pp.user_id = u.id
                     WHERE pp.user_id = $1`,
                    [userId]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                const row = result.rows[0];
                const profile = new PatientProfile(row);
                
                // Add user information to profile
                profile.user = new User({
                    id: row.user_id,
                    email: row.email,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    role: row.role,
                    phone: row.phone,
                    is_active: row.is_active,
                    is_verified: row.is_verified
                });
                
                return profile;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getProfileByUserIdInMemory(userId);
            }
            throw error;
        }
    }
    
    /**
     * Update patient profile
     */
    async updateProfile(userId, profileData) {
        try {
            const client = await pool.connect();
            
            try {
                const { 
                    date_of_birth, 
                    gender, 
                    blood_group,
                    allergies,
                    medical_history,
                    emergency_contact_name,
                    emergency_contact_phone
                } = profileData;
                
                // Check if profile exists
                const checkResult = await client.query(
                    'SELECT 1 FROM patient_profiles WHERE user_id = $1',
                    [userId]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Patient profile not found for user ID ${userId}`);
                }
                
                const result = await client.query(
                    `UPDATE patient_profiles SET
                        date_of_birth = COALESCE($1, date_of_birth),
                        gender = COALESCE($2, gender),
                        blood_group = COALESCE($3, blood_group),
                        allergies = COALESCE($4, allergies),
                        medical_history = COALESCE($5, medical_history),
                        emergency_contact_name = COALESCE($6, emergency_contact_name),
                        emergency_contact_phone = COALESCE($7, emergency_contact_phone),
                        updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $8
                     RETURNING *`,
                    [
                        date_of_birth,
                        gender,
                        blood_group,
                        allergies,
                        medical_history,
                        emergency_contact_name,
                        emergency_contact_phone,
                        userId
                    ]
                );
                
                // Get updated profile with user info
                return await this.getProfileByUserId(userId);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateProfileInMemory(userId, profileData);
            }
            throw error;
        }
    }
    
    /**
     * Get patient prescriptions
     */
    async getPatientPrescriptions(patientId) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if the prescriptions table exists
                const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'prescriptions'
                    );
                `);
                
                if (!tableCheck.rows[0].exists) {
                    console.warn('Prescriptions table does not exist yet');
                    // Return empty array if table doesn't exist
                    return [];
                }
                
                const result = await client.query(
                    `SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC`,
                    [patientId]
                );
                
                return result.rows.map(row => ({
                    id: row.id,
                    patient_id: row.patient_id,
                    doctor_id: row.doctor_id,
                    medication_name: row.medication_name,
                    dosage: row.dosage,
                    frequency: row.frequency,
                    start_date: row.start_date,
                    end_date: row.end_date,
                    status: row.status,
                    notes: row.notes,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getPatientPrescriptionsInMemory(patientId);
            }
            throw error;
        }
    }
    
    /**
     * Get patient medical records
     */
    async getPatientMedicalRecords(patientId) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if the medical_records table exists
                const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'medical_records'
                    );
                `);
                
                if (!tableCheck.rows[0].exists) {
                    console.warn('Medical records table does not exist yet');
                    // Return empty array if table doesn't exist
                    return [];
                }
                
                const result = await client.query(
                    `SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY created_at DESC`,
                    [patientId]
                );
                
                return result.rows;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getPatientMedicalRecordsInMemory(patientId);
            }
            throw error;
        }
    }
    
    /**
     * Get a specific medical record by ID
     */
    async getMedicalRecordById(recordId) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if the medical_records table exists
                const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'medical_records'
                    );
                `);
                
                if (!tableCheck.rows[0].exists) {
                    console.warn('Medical records table does not exist yet');
                    return null;
                }
                
                const result = await client.query(
                    `SELECT * FROM medical_records WHERE id = $1`,
                    [recordId]
                );
                
                return result.rows.length > 0 ? result.rows[0] : null;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getMedicalRecordByIdInMemory(recordId);
            }
            throw error;
        }
    }
    
    /**
     * Get all doctors a patient has consulted with
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array>} List of doctors the patient has consulted with
     */
    async getConsultedDoctors(patientId) {
        const client = await pool.connect();
        try {
            // Get doctors from completed consultations
            const query = `
                SELECT DISTINCT 
                    dp.id, 
                    u.first_name,
                    u.last_name,
                    dp.specialization,
                    (
                        SELECT c.created_at 
                        FROM consultations c 
                        WHERE c.doctor_id = dp.id AND c.patient_id = $1 AND c.status = 'completed'
                        ORDER BY c.created_at DESC
                        LIMIT 1
                    ) as last_consultation_date
                FROM consultations c
                JOIN doctor_profiles dp ON c.doctor_id = dp.id
                JOIN users u ON dp.user_id = u.id
                WHERE c.patient_id = $1 AND c.status = 'completed'
                ORDER BY last_consultation_date DESC
            `;
            
            const result = await client.query(query, [patientId]);
            
            return result.rows.map(row => ({
                id: row.id,
                name: `${row.first_name} ${row.last_name}`,
                specialization: row.specialization,
                lastConsultationDate: this.formatDate(row.last_consultation_date)
            }));
        } catch (error) {
            console.error('Error getting consulted doctors:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Format a date to a readable string
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Get patient prescriptions from memory store
     */
    _getPatientPrescriptionsInMemory(patientId) {
        const prescriptions = memoryStore.prescriptions || [];
        return prescriptions.filter(p => p.patient_id === parseInt(patientId));
    }
    
    /**
     * Get patient medical records from memory store
     */
    _getPatientMedicalRecordsInMemory(patientId) {
        // Initialize medical_records array if it doesn't exist
        if (!memoryStore.medical_records) {
            memoryStore.medical_records = [];
        }
        
        return memoryStore.medical_records.filter(record => 
            record.patient_id === parseInt(patientId)
        );
    }
    
    /**
     * Get a specific medical record by ID from memory store
     */
    _getMedicalRecordByIdInMemory(recordId) {
        // Initialize medical_records array if it doesn't exist
        if (!memoryStore.medical_records) {
            memoryStore.medical_records = [];
        }
        
        return memoryStore.medical_records.find(record => 
            record.id === parseInt(recordId)
        ) || null;
    }
    
    /**
     * Helper method to check for connection errors
     */
    _isConnectionError(error) {
        return error.message.includes('ECONNREFUSED') || 
            error.message.includes('connection refused') ||
            error.message.includes('no pg_hba.conf entry');
    }
    
    /**
     * Create patient profile in memory
     */
    _createProfileInMemory(userId, profileData) {
        console.log(`Using in-memory storage for patient profile creation: ${userId}`);
        
        // Check if user exists and is a patient
        const user = memoryStore.users.find(u => u.id === parseInt(userId) && u.role === 'patient');
        if (!user) {
            throw new Error(`No patient user found with ID ${userId}`);
        }
        
        const profile = {
            id: memoryStore.patientProfiles.length + 1,
            user_id: parseInt(userId),
            date_of_birth: profileData.date_of_birth,
            gender: profileData.gender,
            blood_group: profileData.blood_group,
            allergies: profileData.allergies || '',
            medical_history: profileData.medical_history || '',
            emergency_contact_name: profileData.emergency_contact_name || '',
            emergency_contact_phone: profileData.emergency_contact_phone || '',
            created_at: new Date(),
            updated_at: new Date()
        };
        
        memoryStore.patientProfiles.push(profile);
        
        const patientProfile = new PatientProfile(profile);
        patientProfile.user = new User(user);
        
        return patientProfile;
    }
    
    /**
     * Get patient profile by user ID from memory
     */
    _getProfileByUserIdInMemory(userId) {
        const profile = memoryStore.patientProfiles.find(p => p.user_id === parseInt(userId));
        if (!profile) return null;
        
        const user = memoryStore.users.find(u => u.id === parseInt(userId));
        if (!user) return null;
        
        const patientProfile = new PatientProfile(profile);
        patientProfile.user = new User(user);
        
        return patientProfile;
    }
    
    /**
     * Update patient profile in memory
     */
    _updateProfileInMemory(userId, profileData) {
        const index = memoryStore.patientProfiles.findIndex(p => p.user_id === parseInt(userId));
        if (index === -1) {
            throw new Error(`Patient profile not found for user ID ${userId}`);
        }
        
        const oldProfile = memoryStore.patientProfiles[index];
        const updatedProfile = {
            ...oldProfile,
            ...profileData,
            user_id: oldProfile.user_id,  // Ensure user_id doesn't change
            updated_at: new Date()
        };
        
        memoryStore.patientProfiles[index] = updatedProfile;
        
        return this._getProfileByUserIdInMemory(userId);
    }
}

module.exports = new PatientRepository();
