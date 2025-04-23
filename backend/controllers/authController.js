const authService = require('../services/authService');

// Optional email service
let emailService;
try {
    emailService = require('../services/emailService');
} catch (error) {
    console.log('Email service not available, skipping email functionality');
    emailService = { sendVerificationEmail: () => console.log('Email sending skipped') };
}

/**
 * Handle user registration
 */
const register = async (req, res, next) => {
    try {
        const { email, password, first_name, last_name, role, phone } = req.body;
        
        // Attempt to register user
        const user = await authService.register({ 
            email, password, first_name, last_name, role, phone 
        });
        
        // Send verification email
        emailService.sendVerificationEmail && emailService.sendVerificationEmail(email);
        
        console.log(`User registered successfully: ${email} (${role || 'patient'})`);
        res.status(201).json({ 
            success: true,
            message: 'User registered successfully',
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle user login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Attempt to login user
        const { token, user } = await authService.login(email, password);
        
        res.json({ 
            success: true,
            token,
            user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user information
 */
const getCurrentUser = async (req, res, next) => {
    try {
        // User is already attached to request in auth middleware
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};