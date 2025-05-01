/**
 * Medical Record Routes
 * Defines routes for medical record-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const consultationRepository = require('../repositories/consultationRepository');
const medicalRecordRepository = require('../repositories/medicalRecordRepository');

// Get medical records by appointment ID
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

        // Access control - only the patient, doctor, or admin can view the records
        const isAdmin = req.user.role === 'admin';
        const isDoctorForConsultation = req.user.role === 'doctor' && 
                                      consultation && consultation.doctor && 
                                      consultation.doctor.user && 
                                      consultation.doctor.user.id === req.user.id;
        const isPatientForConsultation = req.user.role === 'patient' && 
                                      consultation && consultation.patient && 
                                      consultation.patient.user && 
                                      consultation.patient.user.id === req.user.id;
                                      
        if (!isAdmin && !isDoctorForConsultation && !isPatientForConsultation) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view these medical records',
                data: []
            });
        }
        
        // Get medical records for this consultation
        const medicalRecords = await medicalRecordRepository.getMedicalRecordsByConsultationId(consultation.id);
        
        return res.json({
            success: true,
            data: medicalRecords
        });
    } catch (error) {
        console.error('Error getting medical records by appointment ID:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching medical records',
            data: []
        });
    }
});

// Get medical records by consultation ID
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
                                      consultation && consultation.doctor && 
                                      consultation.doctor.user && 
                                      consultation.doctor.user.id === req.user.id;
        const isPatientForConsultation = req.user.role === 'patient' && 
                                      consultation && consultation.patient && 
                                      consultation.patient.user && 
                                      consultation.patient.user.id === req.user.id;
                                      
        if (!isAdmin && !isDoctorForConsultation && !isPatientForConsultation) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view these medical records',
                data: []
            });
        }
        
        const medicalRecords = await medicalRecordRepository.getMedicalRecordsByConsultationId(consultationId);
        
        return res.json({
            success: true,
            data: medicalRecords
        });
    } catch (error) {
        console.error('Error getting medical records by consultation ID:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching medical records',
            data: []
        });
    }
});

// Get a specific medical record by ID
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const medicalRecord = await medicalRecordRepository.getMedicalRecordById(id);
        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found'
            });
        }

        // Get the consultation to check permissions
        const consultation = await consultationRepository.getConsultationById(medicalRecord.consultation_id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Associated consultation not found'
            });
        }

        // Access control
        const isAdmin = req.user.role === 'admin';
        const isDoctorForConsultation = req.user.role === 'doctor' && 
                                      consultation && consultation.doctor && 
                                      consultation.doctor.user && 
                                      consultation.doctor.user.id === req.user.id;
        const isPatientForConsultation = req.user.role === 'patient' && 
                                      consultation && consultation.patient && 
                                      consultation.patient.user && 
                                      consultation.patient.user.id === req.user.id;
                                      
        if (!isAdmin && !isDoctorForConsultation && !isPatientForConsultation) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this medical record'
            });
        }
        
        return res.json({
            success: true,
            data: medicalRecord
        });
    } catch (error) {
        console.error('Error getting medical record by ID:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the medical record'
        });
    }
});

module.exports = router;