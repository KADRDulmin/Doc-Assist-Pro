/**
 * Prescription Routes
 * Defines routes for prescription-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const consultationRepository = require('../repositories/consultationRepository');
const prescriptionRepository = require('../repositories/prescriptionRepository');

// Get prescriptions by appointment ID
router.get('/by-appointment/:appointmentId', authenticate, async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        
        // First, get the consultation for this appointment
        const consultation = await consultationRepository.getConsultationByAppointmentId(appointmentId);
        if (!consultation) {
            return res.json({
                success: false,
                message: 'No consultation found for this appointment',
                data: []
            });
        }

        // Access control - only the patient, doctor, or admin can view the prescriptions
        const isAdmin = req.user.role === 'admin';
        const isDoctorForConsultation = req.user.role === 'doctor' && 
                                      consultation.doctor?.user?.id === req.user.id;
        const isPatientForConsultation = req.user.role === 'patient' && 
                                      consultation.patient?.user?.id === req.user.id;
                                      
        if (!isAdmin && !isDoctorForConsultation && !isPatientForConsultation) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view these prescriptions',
                data: []
            });
        }
        
        // Get prescriptions for this consultation
        const prescriptions = await prescriptionRepository.getPrescriptionsByConsultationId(consultation.id);
        
        return res.json({
            success: true,
            data: prescriptions
        });
    } catch (error) {
        console.error('Error getting prescriptions by appointment ID:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching prescriptions',
            data: []
        });
    }
});

// Get prescriptions by consultation ID
router.get('/by-consultation/:consultationId', authenticate, async (req, res, next) => {
    try {
        const { consultationId } = req.params;
        
        // Get the consultation first to check permissions
        const consultation = await consultationRepository.getConsultationById(consultationId);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found',
                data: []
            });
        }

        // Access control
        const isAdmin = req.user.role === 'admin';
        const isDoctorForConsultation = req.user.role === 'doctor' && 
                                      consultation.doctor?.user?.id === req.user.id;
        const isPatientForConsultation = req.user.role === 'patient' && 
                                      consultation.patient?.user?.id === req.user.id;
                                      
        if (!isAdmin && !isDoctorForConsultation && !isPatientForConsultation) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view these prescriptions',
                data: []
            });
        }
        
        const prescriptions = await prescriptionRepository.getPrescriptionsByConsultationId(consultationId);
        
        return res.json({
            success: true,
            data: prescriptions
        });
    } catch (error) {
        console.error('Error getting prescriptions by consultation ID:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching prescriptions',
            data: []
        });
    }
});

// Get patient's active prescriptions
router.get('/patient/:patientId/active', authenticate, async (req, res, next) => {
    try {
        const { patientId } = req.params;
        
        // Access control - only the patient themselves, their doctor, or admin can view prescriptions
        const isAdmin = req.user.role === 'admin';
        const isPatient = req.user.role === 'patient' && req.user.patient_profile_id === parseInt(patientId);
        
        if (!isAdmin && !isPatient && req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view these prescriptions',
                data: []
            });
        }
        
        const prescriptions = await prescriptionRepository.getPatientActivePrescriptions(patientId);
        
        return res.json({
            success: true,
            data: prescriptions
        });
    } catch (error) {
        console.error('Error getting patient active prescriptions:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching prescriptions',
            data: []
        });
    }
});

// Get a specific prescription by ID
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const prescription = await prescriptionRepository.getPrescriptionById(id);
        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Get the consultation to check permissions
        const consultation = await consultationRepository.getConsultationById(prescription.consultation_id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Associated consultation not found'
            });
        }

        // Access control
        const isAdmin = req.user.role === 'admin';
        const isDoctorForConsultation = req.user.role === 'doctor' && 
                                      consultation.doctor?.user?.id === req.user.id;
        const isPatientForConsultation = req.user.role === 'patient' && 
                                      consultation.patient?.user?.id === req.user.id;
                                      
        if (!isAdmin && !isDoctorForConsultation && !isPatientForConsultation) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this prescription'
            });
        }
        
        return res.json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('Error getting prescription by ID:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the prescription'
        });
    }
});

// Complete a prescription (mark as completed)
router.put('/:id/complete', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const prescription = await prescriptionRepository.getPrescriptionById(id);
        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Only doctors and admins can complete prescriptions
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can mark prescriptions as completed'
            });
        }

        // If it's a doctor, ensure it's their prescription
        if (req.user.role === 'doctor' && prescription.doctor?.user?.id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own prescriptions'
            });
        }
        
        const updatedPrescription = await prescriptionRepository.updatePrescription(id, { status: 'completed' });
        
        return res.json({
            success: true,
            message: 'Prescription marked as completed',
            data: updatedPrescription
        });
    } catch (error) {
        console.error('Error completing prescription:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the prescription'
        });
    }
});

// Cancel a prescription
router.put('/:id/cancel', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const prescription = await prescriptionRepository.getPrescriptionById(id);
        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Only doctors and admins can cancel prescriptions
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can cancel prescriptions'
            });
        }

        // If it's a doctor, ensure it's their prescription
        if (req.user.role === 'doctor' && prescription.doctor?.user?.id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own prescriptions'
            });
        }
        
        const updatedPrescription = await prescriptionRepository.updatePrescription(id, { status: 'cancelled' });
        
        return res.json({
            success: true,
            message: 'Prescription cancelled',
            data: updatedPrescription
        });
    } catch (error) {
        console.error('Error cancelling prescription:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the prescription'
        });
    }
});

module.exports = router;