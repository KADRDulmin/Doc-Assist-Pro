const feedbackRepository = require('../repositories/feedbackRepository');
const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');

/**
 * Feedback Controller - Handles feedback-related requests
 */
class FeedbackController {
    /**
     * Submit new feedback
     */
    async submitFeedback(req, res, next) {
        try {
            const { 
                doctor_id,
                appointment_id,
                rating,
                comment
            } = req.body;
            
            if (!doctor_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Doctor ID is required'
                });
            }
            
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating is required and must be between 1 and 5'
                });
            }
            
            // If request is from a patient, use their patient profile ID
            const patientProfile = await patientRepository.getProfileByUserId(req.user.id);
            if (!patientProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient profile not found'
                });
            }
            
            // Check if doctor exists
            const doctorProfile = await doctorRepository.getProfileById(doctor_id);
            if (!doctorProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor not found'
                });
            }
            
            // If appointment_id is provided, check if it exists and belongs to this patient and doctor
            if (appointment_id) {
                const appointmentRepository = require('../repositories/appointmentRepository');
                const appointment = await appointmentRepository.getAppointmentById(appointment_id);
                
                if (!appointment) {
                    return res.status(404).json({
                        success: false,
                        error: 'Appointment not found'
                    });
                }
                
                if (appointment.patient_id !== patientProfile.id || appointment.doctor_id !== doctorProfile.id) {
                    return res.status(403).json({
                        success: false,
                        error: 'This appointment does not belong to you and the specified doctor'
                    });
                }
            }
            
            const feedback = await feedbackRepository.createFeedback({
                patient_id: patientProfile.id,
                doctor_id,
                appointment_id,
                rating,
                comment
            });
            
            res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully',
                data: feedback
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get feedback submitted by the authenticated patient
     */
    async getMyFeedback(req, res, next) {
        try {
            const patientProfile = await patientRepository.getProfileByUserId(req.user.id);
            if (!patientProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient profile not found'
                });
            }
            
            const feedback = await feedbackRepository.getPatientFeedback(patientProfile.id);
            
            res.json({
                success: true,
                data: feedback
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get feedback for a specific doctor
     */
    async getDoctorFeedback(req, res, next) {
        try {
            const { doctorId } = req.params;
            
            // Check if doctor exists
            const doctorProfile = await doctorRepository.getProfileById(doctorId);
            if (!doctorProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor not found'
                });
            }
            
            const feedback = await feedbackRepository.getDoctorFeedback(doctorId);
            
            res.json({
                success: true,
                data: feedback
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get doctor's average rating
     */
    async getDoctorRating(req, res, next) {
        try {
            const { doctorId } = req.params;
            
            // Check if doctor exists
            const doctorProfile = await doctorRepository.getProfileById(doctorId);
            if (!doctorProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor not found'
                });
            }
            
            const ratingData = await feedbackRepository.getDoctorAverageRating(doctorId);
            
            res.json({
                success: true,
                data: ratingData
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Update feedback
     */
    async updateFeedback(req, res, next) {
        try {
            const { feedbackId } = req.params;
            const { rating, comment } = req.body;
            
            // Get the feedback to check ownership
            const existingFeedback = await feedbackRepository.getFeedbackById(feedbackId);
            
            if (!existingFeedback) {
                return res.status(404).json({
                    success: false,
                    error: 'Feedback not found'
                });
            }
            
            // Get patient profile to check ownership
            const patientProfile = await patientRepository.getProfileByUserId(req.user.id);
            if (!patientProfile || existingFeedback.patient_id !== patientProfile.id) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only update your own feedback'
                });
            }
            
            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating must be between 1 and 5'
                });
            }
            
            const updatedFeedback = await feedbackRepository.updateFeedback(feedbackId, {
                rating,
                comment
            });
            
            res.json({
                success: true,
                message: 'Feedback updated successfully',
                data: updatedFeedback
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Delete feedback
     */
    async deleteFeedback(req, res, next) {
        try {
            const { feedbackId } = req.params;
            
            // Get the feedback to check ownership
            const existingFeedback = await feedbackRepository.getFeedbackById(feedbackId);
            
            if (!existingFeedback) {
                return res.status(404).json({
                    success: false,
                    error: 'Feedback not found'
                });
            }
            
            // Check if user is admin or the feedback owner
            if (req.user.isAdmin()) {
                // Admin can delete any feedback
            } else {
                // Patient can only delete their own feedback
                const patientProfile = await patientRepository.getProfileByUserId(req.user.id);
                if (!patientProfile || existingFeedback.patient_id !== patientProfile.id) {
                    return res.status(403).json({
                        success: false,
                        error: 'You can only delete your own feedback'
                    });
                }
            }
            
            await feedbackRepository.deleteFeedback(feedbackId);
            
            res.json({
                success: true,
                message: 'Feedback deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FeedbackController();