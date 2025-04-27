const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireDoctor, requireAdmin } = require('../middleware/roleAuth');

// Public routes
router.get('/', doctorController.getAllDoctors);
router.get('/nearby', doctorController.getNearbyDoctors);
router.get('/:doctorId', doctorController.getDoctorById);

// Doctor registration endpoint
router.post('/register', doctorController.registerDoctor);

// Add debugging endpoints
router.get('/debug/current-user', authenticate, doctorController.getCurrentUser);

// User-specific endpoints to bypass middleware issues
router.get('/dashboard/user/:userId', authenticate, doctorController.getUserDashboard);
router.get('/appointments/user/:userId', authenticate, doctorController.getUserAppointments);
router.get('/patients/user/:userId', authenticate, doctorController.getUserPatients);

// Add a specializations endpoint to help with doctor registration
router.get('/specializations/list', doctorController.getSpecializations);

// Doctor-only routes
router.get('/profile/me', authenticate, requireDoctor, doctorController.getMyProfile);
router.put('/profile/me', authenticate, requireDoctor, doctorController.updateMyProfile);
router.get('/dashboard', authenticate, requireDoctor, doctorController.getDashboardData);
router.get('/appointments', authenticate, requireDoctor, doctorController.getMyAppointments);
router.get('/patients', authenticate, requireDoctor, doctorController.getMyPatients);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, doctorController.getAllDoctors);

module.exports = router;
