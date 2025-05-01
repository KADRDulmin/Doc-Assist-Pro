const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requirePatient, requireDoctor, requireAdmin, requireSelfOrAdmin } = require('../middleware/roleAuth');

// Patient-only routes
router.get('/profile/me', authenticate, requirePatient, patientController.getMyProfile);
router.put('/profile/me', authenticate, requirePatient, patientController.updateMyProfile);

// Dashboard route - for patient's home screen data
router.get('/dashboard', authenticate, requirePatient, patientController.getDashboardData);

// Medical Records endpoints
router.get('/medical-records', authenticate, requirePatient, patientController.getMedicalRecords);
router.get('/medical-records/:recordId', authenticate, requirePatient, patientController.getMedicalRecordById);

// Route for follow-up appointments - get doctors the patient has consulted with
router.get('/consulted-doctors', authenticate, requirePatient, patientController.getConsultedDoctors);

// Doctor and admin routes
router.get('/:patientId', authenticate, requireRole(['doctor', 'admin']), patientController.getPatientById);

// Admin-only routes
router.get('/', authenticate, requireAdmin, async (req, res) => {
    // This would use a patientRepository.getAllPatients method
    // For now, returning a placeholder
    res.json({
        success: true,
        message: 'Admin access to all patients',
        data: []
    });
});

module.exports = router;
