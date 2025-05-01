const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requirePatient, requireAdmin } = require('../middleware/roleAuth');

// Get doctor feedback (public)
router.get('/doctor/:doctorId', feedbackController.getDoctorFeedback);

// Get doctor rating summary (public)
router.get('/doctor/:doctorId/rating', feedbackController.getDoctorRating);

// Add route to get feedback by appointment ID
router.get('/appointment/:appointmentId', authenticate, feedbackController.getAppointmentFeedback);

// Patient routes (require authentication)
router.post('/', authenticate, requirePatient, feedbackController.submitFeedback); // Updated to match frontend
router.post('/submit', authenticate, requirePatient, feedbackController.submitFeedback); // Keep original for backward compatibility
router.get('/my-feedback', authenticate, requirePatient, feedbackController.getMyFeedback);
router.put('/:feedbackId', authenticate, requirePatient, feedbackController.updateFeedback);
router.delete('/:feedbackId', authenticate, feedbackController.deleteFeedback);

module.exports = router;