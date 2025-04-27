const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requirePatient, requireDoctor, requireAdmin } = require('../middleware/roleAuth');

// Public route to get valid appointment types
router.get('/types', (req, res) => {
    const types = require('../models/appointment').getValidTypes();
    res.json({
        success: true,
        data: types
    });
});

// Create new appointment (requires authentication)
router.post('/', authenticate, appointmentController.createAppointment);

// Create new appointment with symptom analysis
router.post('/with-analysis', authenticate, appointmentController.createWithSymptomAnalysis);

// Analyze symptoms without creating an appointment
router.post('/analyze-symptoms', appointmentController.analyzeSymptoms);

// Find recommended doctors based on symptom analysis
router.get('/find-doctors/:speciality', appointmentController.findRecommendedDoctors);

// Get appointments for authenticated user (patient or doctor)
router.get('/my-appointments', authenticate, appointmentController.getMyAppointments);

// Get a specific appointment by ID (restricted to related users)
router.get('/:appointmentId', authenticate, appointmentController.getAppointmentById);

// Update an appointment (restricted to related users)
router.put('/:appointmentId', authenticate, appointmentController.updateAppointment);

// Cancel an appointment (restricted to related users)
router.post('/:appointmentId/cancel', authenticate, appointmentController.cancelAppointment);

// Complete an appointment (doctors only)
router.post('/:appointmentId/complete', authenticate, requireDoctor, appointmentController.completeAppointment);

// Mark an appointment as missed (admin/doctor only)
router.post('/:id/missed', authenticate, requireRole(['admin', 'doctor']), appointmentController.markAsMissed);

// Check for missed appointments (admin only)
router.post('/check-missed', authenticate, requireAdmin, appointmentController.checkMissedAppointments);

// Get available time slots for a doctor on a specific date
router.get('/availability/:doctorId', appointmentController.getDoctorAvailability);

// Admin routes
router.get('/patient/:patientId', authenticate, requireRole(['doctor', 'admin']), appointmentController.getPatientAppointments);
router.get('/doctor/:doctorId', authenticate, requireAdmin, appointmentController.getDoctorAppointments);

module.exports = router;