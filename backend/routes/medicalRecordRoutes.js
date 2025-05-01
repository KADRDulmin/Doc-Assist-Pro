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

// Get all medical records for a patient
// This must be before the /:id route to prevent incorrect matching
router.get('/patient/:patientId', authenticate, requireRole(['doctor', 'admin']), async (req, res, next) => {
    try {
        const { patientId } = req.params;
        
        // Access control - if doctor, check if they have treated this patient
        if (req.user.role === 'doctor') {
            const doctorRepository = require('../repositories/doctorRepository');
            const doctorProfile = await doctorRepository.getProfileByUserId(req.user.id);
            
            if (!doctorProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found'
                });
            }
            
            // For development, temporarily allow all doctors to view any patient's records
            // Remove this in production and uncomment the check below
            /*
            // Check if doctor has treated this patient (has a consultation with them)
            const hasConsultation = await consultationRepository.doctorHasConsultationWithPatient(
                doctorProfile.id, 
                patientId
            );
            
            if (!hasConsultation) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view medical records for this patient'
                });
            }
            */
        }
        
        // Get medical records for this patient
        const medicalRecords = await medicalRecordRepository.getPatientMedicalRecords(patientId);
        
        return res.json({
            success: true,
            data: medicalRecords
        });
    } catch (error) {
        console.error('Error getting medical records by patient ID:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching medical records',
            data: []
        });
    }
});

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
// This should be at the end because it's a catch-all route
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