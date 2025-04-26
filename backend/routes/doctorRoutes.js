const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireDoctor, requireAdmin } = require('../middleware/roleAuth');

// Public routes
router.get('/', doctorController.getAllDoctors);
router.get('/nearby', doctorController.getNearbyDoctors);
router.get('/:doctorId', doctorController.getDoctorById);

// Add a specializations endpoint to help with doctor registration
router.get('/specializations/list', (req, res) => {
    try {
        const DoctorProfile = require('../models/doctor-profile');
        const specializations = DoctorProfile.getSpecializations();
        
        res.json({
            success: true,
            data: specializations
        });
    } catch (error) {
        console.error('Error fetching specializations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch specializations',
            message: error.message
        });
    }
});

// Doctor-only routes
router.get('/profile/me', authenticate, requireDoctor, doctorController.getMyProfile);
router.put('/profile/me', authenticate, requireDoctor, doctorController.updateMyProfile);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, doctorController.getAllDoctors);

module.exports = router;
