/**
 * Consultation Routes
 * Defines routes for consultation-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Import the controller directly
const consultationController = require('../controllers/consultationController');

// Define routes with inline functions that call the controller methods
// This approach avoids issues with method binding and undefined methods

// IMPORTANT: Define more specific routes before generic ones

// Start a new consultation for an appointment (doctors only)
router.post('/appointment/:appointmentId/start', authenticate, requireRole(['doctor']), (req, res, next) => {
    consultationController.startConsultation(req, res, next);
});

// Get consultation by appointment ID
router.get('/appointment/:appointmentId', authenticate, (req, res, next) => {
    consultationController.getConsultationByAppointment(req, res, next);
});

// Get all consultations for the authenticated doctor
router.get('/doctor/my-consultations', authenticate, requireRole(['doctor']), (req, res, next) => {
    consultationController.getDoctorConsultations(req, res, next);
});

// Get all consultations for the authenticated patient
router.get('/patient/my-consultations', authenticate, requireRole(['patient']), (req, res, next) => {
    consultationController.getPatientConsultations(req, res, next);
});

// Get consultation by ID - generic pattern should come after more specific ones
router.get('/:consultationId', authenticate, (req, res, next) => {
    consultationController.getConsultation(req, res, next);
});

// Complete a consultation (doctors only)
router.post('/:consultationId/complete', authenticate, requireRole(['doctor']), (req, res, next) => {
    consultationController.completeConsultation(req, res, next);
});

// Mark a consultation as missed (doctors only)
router.post('/:consultationId/missed', authenticate, requireRole(['doctor']), (req, res, next) => {
    consultationController.markConsultationAsMissed(req, res, next);
});

// Add medical record to a consultation (doctors only)
router.post('/:consultationId/medical-record', authenticate, requireRole(['doctor']), (req, res, next) => {
    consultationController.addMedicalRecord(req, res, next);
});

// Get medical records for a consultation
router.get('/:consultationId/medical-records', authenticate, (req, res, next) => {
    consultationController.getConsultationMedicalRecords(req, res, next);
});

// Add prescription to a consultation (doctors only)
router.post('/:consultationId/prescription', authenticate, requireRole(['doctor']), (req, res, next) => {
    consultationController.addPrescription(req, res, next);
});

// Get prescriptions for a consultation
router.get('/:consultationId/prescriptions', authenticate, (req, res, next) => {
    consultationController.getConsultationPrescriptions(req, res, next);
});

// Submit consultation data with medical records and prescriptions (doctors only)
router.post('/:consultationId/submit', authenticate, requireRole(['doctor']), (req, res, next) => {
    consultationController.submitConsultation(req, res, next);
});

module.exports = router;