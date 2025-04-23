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
