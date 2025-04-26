const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const doctorController = require('../controllers/doctorController');
const patientController = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
// Import DoctorProfile model directly
const DoctorProfile = require('../models/doctor-profile');

// General auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Add logout route (requires authentication)
router.post('/logout', authenticate, authController.logout);

// Add refresh token endpoint
router.post('/refresh-token', authController.refreshToken);

// Role-specific registration routes
router.post('/register/doctor', doctorController.registerDoctor);
router.post('/register/patient', patientController.registerPatient);

// Add test endpoint for doctor registration that doesn't create records
// This should be placed BEFORE the debug endpoints to avoid route conflicts
router.post('/register/doctor/test', (req, res) => {
    console.log('Test endpoint hit');
    return doctorController.testRegisterDoctor(req, res);
});

// Add a simple echo test endpoint
router.post('/test-echo', (req, res) => {
    console.log('Echo endpoint hit');
    res.json({
        success: true,
        message: 'Echo endpoint working',
        body: req.body,
        headers: {
            contentType: req.headers['content-type'],
            // Don't include authorization header for security
            userAgent: req.headers['user-agent']
        },
        timestamp: new Date().toISOString()
    });
});

// GET routes for testing in browser (will show error)
router.get('/register', (req, res) => {
    res.status(405).json({ error: 'Method not allowed. Please use POST for registration.' });
});
router.get('/login', (req, res) => {
    res.status(405).json({ error: 'Method not allowed. Please use POST for login.' });
});

// Add debug endpoint for doctor registration
router.get('/register/doctor/debug', (req, res) => {
    try {
        // Get the specializations directly from the model
        const validSpecializations = DoctorProfile.getSpecializations();
        
        res.json({
            success: true,
            message: 'Doctor registration endpoint is available',
            required_fields: {
                user_data: ['email', 'password', 'first_name', 'last_name', 'phone'],
                profile_data: ['specialization', 'license_number', 'years_of_experience', 'education', 'bio', 'consultation_fee']
            },
            valid_specializations: validSpecializations,
            endpoint_url: `${req.protocol}://${req.get('host')}/api/auth/register/doctor`,
            method: 'POST',
            content_type: 'application/json'
        });
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error in debug endpoint',
            message: error.message
        });
    }
});

// Add validation test endpoint for doctor registration
router.post('/register/doctor/validate', (req, res) => {
    try {
        const { 
            email, password, first_name, last_name, phone,
            specialization, license_number, years_of_experience, education, bio, consultation_fee
        } = req.body;
        
        const validationErrors = [];
        
        // Validate user data
        if (!email) validationErrors.push('Email is required');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            validationErrors.push('Email format is invalid');
        
        if (!password) validationErrors.push('Password is required');
        else if (password.length < 6)
            validationErrors.push('Password must be at least 6 characters');
        
        // Validate doctor profile data
        if (!specialization) validationErrors.push('Specialization is required');
        else {
            // Get specializations directly from the model
            const validSpecializations = DoctorProfile.getSpecializations();
            if (!validSpecializations.includes(specialization))
                validationErrors.push(`Specialization must be one of: ${validSpecializations.join(', ')}`);
        }
        
        if (!license_number) validationErrors.push('License number is required');
        
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: validationErrors
            });
        }
        
        res.json({
            success: true,
            message: 'Request body is valid',
            body: req.body
        });
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during validation',
            message: error.message
        });
    }
});

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/verify-token', authenticate, (req, res) => {
    res.json({ 
        success: true,
        user: req.user,
        message: 'Token is valid'
    });
});

module.exports = router;
