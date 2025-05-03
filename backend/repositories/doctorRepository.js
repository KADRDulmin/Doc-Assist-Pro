const { pool } = require('../config/database');
const DoctorProfile = require('../models/doctor-profile');
const User = require('../models/user');
const memoryStore = require('../utils/memoryStore');

/**
 * Doctor Repository - Handles doctor profile data access
 */
class DoctorRepository {
    /**
     * Create a doctor profile
     */
    async createProfile(userId, profileData) {
        try {
            const { 
                specialization, 
                license_number, 
                years_of_experience = 0,
                education = '',
                bio = '',
                consultation_fee = 0,
                latitude = null,
                longitude = null,
                address = ''
            } = profileData;
            
            const client = await pool.connect();
            
            try {
                console.log(`Creating doctor profile for user ID: ${userId}`);
                
                // Make sure the user exists and is a doctor
                const userResult = await client.query(
                    "SELECT * FROM users WHERE id = $1 AND role = 'doctor'",
                    [userId]
                );
                
                if (userResult.rows.length === 0) {
                    throw new Error(`No doctor user found with ID ${userId}`);
                }
                
                const result = await client.query(
                    `INSERT INTO doctor_profiles (
                        user_id, specialization, license_number, 
                        years_of_experience, education, bio, consultation_fee,
                        latitude, longitude, address
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                    [
                        userId, 
                        specialization, 
                        license_number, 
                        years_of_experience,
                        education,
                        bio,
                        consultation_fee,
                        latitude,
                        longitude,
                        address
                    ]
                );
                
                const profile = new DoctorProfile(result.rows[0]);
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
            
            // Handle duplicate license numbers
            if (error.code === '23505' && error.constraint?.includes('license_number')) {
                throw new Error(`License number ${profileData.license_number} is already registered`);
            }
            
            throw error;
        }
    }
    
    /**
     * Get doctor profile by user ID
     */
    async getProfileByUserId(userId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone, u.is_active, u.is_verified
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE dp.user_id = $1`,
                    [userId]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                const row = result.rows[0];
                const profile = new DoctorProfile(row);
                
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
     * Get doctor profile by ID
     * @param {number} id - Doctor profile ID
     * @returns {Promise<DoctorProfile|null>} Doctor profile or null if not found
     */
    async getProfileById(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone, u.is_active, u.is_verified
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE dp.id = $1`,
                    [id]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                const row = result.rows[0];
                const profile = new DoctorProfile(row);
                
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
                return this._getProfileByIdInMemory(id);
            }
            throw error;
        }
    }
    
    /**
     * Get all doctors with their profiles
     */
    async getAllDoctors(options = {}) {
        const { specialization = null, limit = 100, offset = 0 } = options;
        
        try {
            const client = await pool.connect();
            
            try {
                let query = `
                    SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone, u.is_active, u.is_verified
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE u.is_active = true
                `;
                
                const params = [];
                
                // Add specialization filter if provided
                if (specialization) {
                    params.push(specialization);
                    query += ` AND dp.specialization = $${params.length}`;
                }
                
                // Add pagination
                query += ` ORDER BY u.first_name, u.last_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
                params.push(limit, offset);
                
                const result = await client.query(query, params);
                
                return result.rows.map(row => {
                    const profile = new DoctorProfile(row);
                    
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
                });
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getAllDoctorsInMemory(options);
            }
            throw error;
        }
    }
    
    /**
     * Update doctor profile
     */
    async updateProfile(userId, profileData) {
        try {
            const client = await pool.connect();
            
            try {
                const { 
                    specialization, 
                    years_of_experience,
                    education,
                    bio,
                    consultation_fee,
                    latitude,
                    longitude,
                    address
                } = profileData;
                
                // Check if profile exists
                const checkResult = await client.query(
                    'SELECT 1 FROM doctor_profiles WHERE user_id = $1',
                    [userId]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Doctor profile not found for user ID ${userId}`);
                }
                
                const result = await client.query(
                    `UPDATE doctor_profiles SET
                        specialization = COALESCE($1, specialization),
                        years_of_experience = COALESCE($2, years_of_experience),
                        education = COALESCE($3, education),
                        bio = COALESCE($4, bio),
                        consultation_fee = COALESCE($5, consultation_fee),
                        latitude = COALESCE($6, latitude),
                        longitude = COALESCE($7, longitude),
                        address = COALESCE($8, address),
                        updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $9
                     RETURNING *`,
                    [
                        specialization, 
                        years_of_experience,
                        education,
                        bio,
                        consultation_fee,
                        latitude,
                        longitude,
                        address,
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
     * Create doctor profile in memory
     */
    _createProfileInMemory(userId, profileData) {
        console.log(`Using in-memory storage for doctor profile creation: ${userId}`);
        
        // Check if user exists and is a doctor
        const user = memoryStore.users.find(u => u.id === parseInt(userId) && u.role === 'doctor');
        if (!user) {
            throw new Error(`No doctor user found with ID ${userId}`);
        }
        
        // Check for duplicate license numbers
        if (memoryStore.doctorProfiles.some(p => 
            p.license_number === profileData.license_number)) {
            throw new Error(`License number ${profileData.license_number} is already registered`);
        }
        
        const profile = {
            id: memoryStore.doctorProfiles.length + 1,
            user_id: parseInt(userId),
            specialization: profileData.specialization,
            license_number: profileData.license_number,
            years_of_experience: profileData.years_of_experience || 0,
            education: profileData.education || '',
            bio: profileData.bio || '',
            consultation_fee: profileData.consultation_fee || 0,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        memoryStore.doctorProfiles.push(profile);
        
        const doctorProfile = new DoctorProfile(profile);
        doctorProfile.user = new User(user);
        
        return doctorProfile;
    }
    
    /**
     * Get doctor profile by user ID from memory
     */
    _getProfileByUserIdInMemory(userId) {
        const profile = memoryStore.doctorProfiles.find(p => p.user_id === parseInt(userId));
        if (!profile) return null;
        
        const user = memoryStore.users.find(u => u.id === parseInt(userId));
        if (!user) return null;
        
        const doctorProfile = new DoctorProfile(profile);
        doctorProfile.user = new User(user);
        
        return doctorProfile;
    }
    
    /**
     * Get doctor profile by ID from memory
     * @param {number} id - Doctor profile ID
     * @returns {DoctorProfile|null} Doctor profile or null if not found
     */
    _getProfileByIdInMemory(id) {
        const profile = memoryStore.doctorProfiles.find(p => p.id === parseInt(id));
        if (!profile) return null;
        
        const user = memoryStore.users.find(u => u.id === profile.user_id);
        if (!user) return null;
        
        const doctorProfile = new DoctorProfile(profile);
        doctorProfile.user = new User(user);
        
        return doctorProfile;
    }
    
    /**
     * Get all doctors from memory
     */
    _getAllDoctorsInMemory(options = {}) {
        const { specialization = null, limit = 100, offset = 0 } = options;
        
        let profiles = memoryStore.doctorProfiles;
        
        if (specialization) {
            profiles = profiles.filter(p => p.specialization === specialization);
        }
        
        return profiles
            .slice(offset, offset + limit)
            .map(profile => {
                const user = memoryStore.users.find(u => u.id === profile.user_id);
                if (!user || !user.is_active) return null;
                
                const doctorProfile = new DoctorProfile(profile);
                doctorProfile.user = user ? new User(user) : null;
                
                return doctorProfile;
            })
            .filter(Boolean);
    }
    
    /**
     * Update doctor profile in memory
     */
    _updateProfileInMemory(userId, profileData) {
        const index = memoryStore.doctorProfiles.findIndex(p => p.user_id === parseInt(userId));
        if (index === -1) {
            throw new Error(`Doctor profile not found for user ID ${userId}`);
        }
        
        const oldProfile = memoryStore.doctorProfiles[index];
        const updatedProfile = {
            ...oldProfile,
            ...profileData,
            user_id: oldProfile.user_id,  // Ensure user_id doesn't change
            updated_at: new Date()
        };
        
        memoryStore.doctorProfiles[index] = updatedProfile;
        
        return this._getProfileByUserIdInMemory(userId);
    }
}

module.exports = new DoctorRepository();
