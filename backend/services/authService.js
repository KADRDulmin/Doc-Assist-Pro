const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const User = require('../models/user');

/**
 * Authentication Service
 */
class AuthService {
    /**
     * Register a new user
     */
    async register(email, password) {
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
        
        return await userRepository.create(email, password);
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
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Invalid credentials');
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRY || '1h' }
        );
        
        return { user: user.toJSON(), token };
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
