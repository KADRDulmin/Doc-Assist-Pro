const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requirePatient, requireAdmin } = require('../middleware/roleAuth');

// Get doctor feedback (public)
router.get('/doctor/:doctorId', feedbackController.getDoctorFeedback);

// Get doctor rating summary (public)
router.get('/doctor/:doctorId/rating', feedbackController.getDoctorRating);

// Patient routes (require authentication)
router.post('/submit', authenticate, requirePatient, feedbackController.submitFeedback);
router.get('/my-feedback', authenticate, requirePatient, feedbackController.getMyFeedback);
router.put('/:feedbackId', authenticate, requirePatient, feedbackController.updateFeedback);
router.delete('/:feedbackId', authenticate, feedbackController.deleteFeedback);

module.exports = router;