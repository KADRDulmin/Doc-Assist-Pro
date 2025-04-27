const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const User = require('../models/user');

/**
 * Authentication Service
 */
class AuthService {
    /**
     * Register a new user with role
     */
    async register(userData) {
        const { email, password, first_name, last_name, role = 'patient', phone } = userData;
        
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        // Use User model for validation
        if (!User.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }
        
        // Password validation
        const passwordValidation = User.validatePassword(password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message);
        }
        
        // Validate role if specified
        if (role && !User.isValidRole(role)) {
            throw new Error(`Invalid role. Allowed roles: ${User.getRoles().join(', ')}`);
        }
        
        return await userRepository.create({
            email, 
            password, 
            first_name, 
            last_name, 
            role,
            phone
        });
    }
    
    /**
     * Register a doctor (specialized registration)
     */
    async registerDoctor(userData, profileData) {
        // Force doctor role
        userData.role = 'doctor';
        
        try {
            console.log('Starting doctor registration process...');
            console.log('User data:', JSON.stringify(userData, null, 2));
            console.log('Profile data:', JSON.stringify(profileData, null, 2));
            
            // Register the user first
            let user;
            try {
                user = await this.register(userData);
                console.log('User registration successful:', user.id);
            } catch (userError) {
                console.error('Error registering doctor user:', userError);
                throw userError;
            }
            
            // Now create doctor profile using the doctor repository
            try {
                const doctorRepository = require('../repositories/doctorRepository');
                const doctorProfile = await doctorRepository.createProfile(user.id, profileData);
                console.log('Doctor profile created successfully for user ID:', user.id);
                return doctorProfile;
            } catch (profileError) {
                console.error('Error creating doctor profile:', profileError);
                
                // Attempt to roll back user creation if profile creation fails
                try {
                    const userRepository = require('../repositories/userRepository');
                    console.log('Rolling back user creation for user ID:', user.id);
                    // You may need to implement a delete method in userRepository
                    // await userRepository.delete(user.id);
                } catch (rollbackError) {
                    console.error('Failed to roll back user creation:', rollbackError);
                }
                
                throw profileError;
            }
        } catch (error) {
            console.error('Doctor registration failed:', error);
            throw error;
        }
    }
    
    /**
     * Register a patient (specialized registration)
     */
    async registerPatient(userData, profileData) {
        // Force patient role
        userData.role = 'patient';
        
        // Register the user first
        const user = await this.register(userData);
        
        // Now create patient profile using the patient repository
        const patientRepository = require('../repositories/patientRepository');
        return await patientRepository.createProfile(user.id, profileData);
    }
    
    /**
     * Login a user
     */
    async login(email, password) {
        console.log(`[AUTH] Login attempt for email: ${email}`);
        
        if (!email || !password) {
            console.log('[AUTH] Login failed: Email or password missing');
            throw new Error('Email and password are required');
        }
        
        // Email validation for login
        if (!User.isValidEmail(email)) {
            console.log('[AUTH] Login failed: Invalid email format');
            throw new Error('Invalid email format');
        }
        
        const user = await userRepository.findByEmail(email);
        if (!user) {
            console.log(`[AUTH] Login failed: No user found with email: ${email}`);
            throw new Error('Invalid credentials');
        }
        
        console.log(`[AUTH] User found: ${user.id} (${user.email})`);
        
        // Check if user is active
        if (!user.is_active) {
            console.log(`[AUTH] Login failed: Account inactive for user: ${user.id}`);
            throw new Error('Account is inactive. Please contact support.');
        }
        
        try {
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                console.log(`[AUTH] Login failed: Invalid password for user: ${user.id}`);
                throw new Error('Invalid credentials');
            }
            
            // Generate JWT token with role
            const token = this.generateToken(user);
            console.log(`[AUTH] Login successful for user: ${user.id}`);
            
            return { user: user.toJSON(), token };
        } catch (error) {
            console.error(`[AUTH] Error during login process:`, error);
            throw error;
        }
    }
    
    /**
     * Generate a new JWT token for a user
     */
    generateToken(user) {
        return jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRY || '24h' } // Extended expiration time to 24 hours
        );
    }
    
    /**
     * Refresh an existing token
     */
    refreshToken(oldToken) {
        try {
            // Verify the existing token
            const decoded = this.verifyToken(oldToken, true);
            
            // Get user info from the decoded token
            const { userId, email, role } = decoded;
            
            // Generate a new token
            return jwt.sign(
                { userId, email, role }, 
                process.env.JWT_SECRET, 
                { expiresIn: process.env.JWT_EXPIRY || '24h' }
            );
        } catch (error) {
            throw new Error('Unable to refresh token: ' + error.message);
        }
    }
    
    /**
     * Logout a user
     * Sets the user's active status to false in the database
     */
    async logout(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        // Update to not deactivate account on logout
        // Just return success message
        return { success: true, message: 'Logged out successfully' };
    }
    
    /**
     * Verify JWT token
     * @param {string} token - The JWT token to verify
     * @param {boolean} ignoreExpiration - Whether to ignore token expiration (for refresh)
     */
    verifyToken(token, ignoreExpiration = false) {
        if (!token) {
            throw new Error('No token provided');
        }
        
        try {
            const options = ignoreExpiration ? { ignoreExpiration: true } : {};
            return jwt.verify(token, process.env.JWT_SECRET, options);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            throw new Error('Invalid token');
        }
    }
}

module.exports = new AuthService();
