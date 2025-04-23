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
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        // Email validation for login
        if (!User.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }
        
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        // Check if user is active
        if (!user.is_active) {
            throw new Error('Account is inactive. Please contact support.');
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Invalid credentials');
        }
        
        // Generate JWT token with role
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRY || '1h' }
        );
        
        return { user: user.toJSON(), token };
    }
    
    /**
     * Logout a user
     * Sets the user's active status to false in the database
     */
    async logout(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        // Deactivate user account by setting is_active to false
        const user = await userRepository.updateActiveStatus(userId, false);
        
        return { success: true, message: 'Logged out successfully' };
    }
    
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        if (!token) {
            throw new Error('No token provided');
        }
        
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}

module.exports = new AuthService();
