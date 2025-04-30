/**
 * Consultation Controller
 * Handles API requests related to consultations
 */

const consultationRepository = require('../repositories/consultationRepository');
const appointmentRepository = require('../repositories/appointmentRepository');
const medicalRecordRepository = require('../repositories/medicalRecordRepository');
const prescriptionRepository = require('../repositories/prescriptionRepository');
const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');
const { ValidationError } = require('../utils/errors');

// Export an object with all controller methods directly
module.exports = {
    /**
     * Start a new consultation for an appointment
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async startConsultation(req, res, next) {
        try {
            const { appointmentId } = req.params;
            
            // Get the appointment to verify it exists and get patient/doctor info
            const appointment = await appointmentRepository.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
            
            // Verify the doctor is making this request
            if (req.user.role !== 'doctor') {
                return res.status(403).json({
                    success: false,
                    error: 'Only doctors can start consultations'
                });
            }
            
            // Get the doctor profile
            const doctorProfile = await doctorRepository.getProfileByUserId(req.user.id);
            if (!doctorProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor profile not found'
                });
            }
            
            // Make sure the doctor is the one assigned to this appointment
            if (doctorProfile.id !== appointment.doctor_id) {
                return res.status(403).json({
                    success: false,
                    error: 'You are not authorized to start this consultation'
                });
            }
            
            // Check if the consultation already exists
            const existingConsultation = await consultationRepository.getConsultationByAppointmentId(appointmentId);
            if (existingConsultation) {
                return res.status(200).json({
                    success: true,
                    message: 'Consultation already exists',
                    data: existingConsultation
                });
            }
            
            // Create a new consultation
            const consultation = await consultationRepository.createConsultation({
                appointment_id: appointmentId,
                doctor_id: appointment.doctor_id,
                patient_id: appointment.patient_id,
                status: 'in_progress',
                actual_start_time: new Date()
            });
            
            res.status(201).json({
                success: true,
                message: 'Consultation started successfully',
                data: consultation
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get consultation by ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getConsultation(req, res, next) {
        try {
            const { consultationId } = req.params;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
                });
            }
            
            // Access control - only the patient, doctor, or admin can view the consultation
            const isAdmin = req.user.role === 'admin';
            const isDoctorForConsultation = req.user.role === 'doctor' && 
                                          consultation.doctor?.user?.id === req.user.id;
            const isPatientForConsultation = req.user.role === 'patient' && 
                                          consultation.patient?.user?.id === req.user.id;
                                          
            if (isAdmin || isDoctorForConsultation || isPatientForConsultation) {
                res.json({
                    success: true,
                    data: consultation
                });
            } else {
                res.status(403).json({
                    success: false,
                    error: 'You do not have permission to view this consultation'
                });
            }
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get consultation by appointment ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getConsultationByAppointment(req, res, next) {
        try {
            const { appointmentId } = req.params;
            
            // First, check if the appointment exists
            const appointment = await appointmentRepository.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
            
            // Access control - only the patient, doctor, or admin can view the consultation
            const isAdmin = req.user.role === 'admin';
            const isDoctorForAppointment = req.user.role === 'doctor' && 
                                          appointment.doctor?.user?.id === req.user.id;
            const isPatientForAppointment = req.user.role === 'patient' && 
                                          appointment.patient?.user?.id === req.user.id;
                                          
            if (!isAdmin && !isDoctorForAppointment && !isPatientForAppointment) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to view this consultation'
                });
            }
            
            const consultation = await consultationRepository.getConsultationByAppointmentId(appointmentId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'No consultation found for this appointment'
                });
            }
            
            res.json({
                success: true,
                data: consultation
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Complete a consultation
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async completeConsultation(req, res, next) {
        try {
            const { consultationId } = req.params;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
                });
            }
            
            // Only the doctor who created the consultation can complete it
            const isDoctorForConsultation = req.user.role === 'doctor' && 
                                          consultation.doctor?.user?.id === req.user.id;
                                          
            if (!isDoctorForConsultation) {
                return res.status(403).json({
                    success: false,
                    error: 'Only the consulting doctor can complete this consultation'
                });
            }
            
            // Update both the consultation and appointment status
            const completedConsultation = await consultationRepository.completeConsultation(consultationId);
            
            res.json({
                success: true,
                message: 'Consultation completed successfully',
                data: completedConsultation
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Mark a consultation as missed
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async markConsultationAsMissed(req, res, next) {
        try {
            const { consultationId } = req.params;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
                });
            }
            
            // Only the doctor who created the consultation can mark it as missed
            const isDoctorForConsultation = req.user.role === 'doctor' && 
                                          consultation.doctor?.user?.id === req.user.id;
                                          
            if (!isDoctorForConsultation) {
                return res.status(403).json({
                    success: false,
                    error: 'Only the consulting doctor can mark this consultation as missed'
                });
            }
            
            // Update both the consultation and appointment status
            const missedConsultation = await consultationRepository.markConsultationAsMissed(consultationId);
            
            res.json({
                success: true,
                message: 'Consultation marked as missed',
                data: missedConsultation
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Add a medical record to a consultation
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async addMedicalRecord(req, res, next) {
        try {
            const { consultationId } = req.params;
            const {
                diagnosis,
                diagnosis_image_url,
                treatment_plan,
                notes
            } = req.body;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
                });
            }
            
            // Only the doctor who created the consultation can add medical records
            const isDoctorForConsultation = req.user.role === 'doctor' && 
                                          consultation.doctor?.user?.id === req.user.id;
                                          
            if (!isDoctorForConsultation) {
                return res.status(403).json({
                    success: false,
                    error: 'Only the consulting doctor can add medical records'
                });
            }
            
            // Require either diagnosis text or image
            if (!diagnosis && !diagnosis_image_url) {
                return res.status(400).json({
                    success: false,
                    error: 'Either diagnosis text or image URL must be provided'
                });
            }
            
            const medicalRecord = await medicalRecordRepository.createMedicalRecord({
                consultation_id: consultationId,
                patient_id: consultation.patient_id,
                doctor_id: consultation.doctor_id,
                record_date: new Date(),
                diagnosis,
                diagnosis_image_url,
                treatment_plan,
                notes
            });
            
            res.status(201).json({
                success: true,
                message: 'Medical record added successfully',
                data: medicalRecord
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Add a prescription to a consultation
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async addPrescription(req, res, next) {
        try {
            const { consultationId } = req.params;
            const {
                prescription_text,
                prescription_image_url,
                duration_days,
                notes
            } = req.body;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
                });
            }
            
            // Only the doctor who created the consultation can add prescriptions
            const isDoctorForConsultation = req.user.role === 'doctor' && 
                                          consultation.doctor?.user?.id === req.user.id;
                                          
            if (!isDoctorForConsultation) {
                return res.status(403).json({
                    success: false,
                    error: 'Only the consulting doctor can add prescriptions'
                });
            }
            
            // Require either prescription text or image
            if (!prescription_text && !prescription_image_url) {
                return res.status(400).json({
                    success: false,
                    error: 'Either prescription text or image URL must be provided'
                });
            }
            
            const prescription = await prescriptionRepository.createPrescription({
                consultation_id: consultationId,
                patient_id: consultation.patient_id,
                doctor_id: consultation.doctor_id,
                prescription_date: new Date(),
                prescription_text,
                prescription_image_url,
                status: 'active',
                duration_days,
                notes
            });
            
            res.status(201).json({
                success: true,
                message: 'Prescription added successfully',
                data: prescription
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Complete consultation with medical record and prescription
     * This endpoint allows a doctor to submit all consultation data in one request
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async submitConsultation(req, res, next) {
        try {
            const { consultationId } = req.params;
            const {
                // Medical record data
                diagnosis,
                diagnosis_image_url,
                treatment_plan,
                medical_notes,
                
                // Prescription data
                prescription_text,
                prescription_image_url,
                duration_days,
                prescription_notes,
                
                // Whether to mark the consultation as completed
                complete_consultation = true
            } = req.body;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
                });
            }
            
            // Only the doctor who created the consultation can submit consultation data
            const isDoctorForConsultation = req.user.role === 'doctor' && 
                                          consultation.doctor?.user?.id === req.user.id;
                                          
            if (!isDoctorForConsultation) {
                return res.status(403).json({
                    success: false,
                    error: 'Only the consulting doctor can submit consultation data'
                });
            }
            
            // Add medical record if diagnosis data is provided
            let medicalRecord = null;
            if (diagnosis || diagnosis_image_url) {
                medicalRecord = await medicalRecordRepository.createMedicalRecord({
                    consultation_id: consultationId,
                    patient_id: consultation.patient_id,
                    doctor_id: consultation.doctor_id,
                    record_date: new Date(),
                    diagnosis: diagnosis || '',
                    diagnosis_image_url,
                    treatment_plan: treatment_plan || '',
                    notes: medical_notes || ''
                });
            }
            
            // Add prescription if prescription data is provided
            let prescription = null;
            if (prescription_text || prescription_image_url) {
                prescription = await prescriptionRepository.createPrescription({
                    consultation_id: consultationId,
                    patient_id: consultation.patient_id,
                    doctor_id: consultation.doctor_id,
                    prescription_date: new Date(),
                    prescription_text: prescription_text || '',
                    prescription_image_url,
                    status: 'active',
                    duration_days,
                    notes: prescription_notes || ''
                });
            }
            
            // Complete the consultation if requested
            let updatedConsultation = consultation;
            if (complete_consultation) {
                updatedConsultation = await consultationRepository.completeConsultation(consultationId);
            }
            
            // Get the updated consultation with all related data
            const finalConsultation = await consultationRepository.getConsultationById(consultationId);
            
            res.json({
                success: true,
                message: complete_consultation ? 'Consultation completed successfully' : 'Consultation data saved',
                data: {
                    consultation: finalConsultation,
                    medicalRecord,
                    prescription
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get all medical records for a consultation
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getConsultationMedicalRecords(req, res, next) {
        try {
            const { consultationId } = req.params;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
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
                    error: 'You do not have permission to view these medical records'
                });
            }
            
            const medicalRecords = await medicalRecordRepository.getMedicalRecordsByConsultationId(consultationId);
            
            res.json({
                success: true,
                data: medicalRecords
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get all prescriptions for a consultation
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getConsultationPrescriptions(req, res, next) {
        try {
            const { consultationId } = req.params;
            
            const consultation = await consultationRepository.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
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
                    error: 'You do not have permission to view these prescriptions'
                });
            }
            
            const prescriptions = await prescriptionRepository.getPrescriptionsByConsultationId(consultationId);
            
            res.json({
                success: true,
                data: prescriptions
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get all consultations for the authenticated doctor
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getDoctorConsultations(req, res, next) {
        try {
            const { status } = req.query;
            
            if (req.user.role !== 'doctor') {
                return res.status(403).json({
                    success: false,
                    error: 'Only doctors can access their consultations'
                });
            }
            
            const doctorProfile = await doctorRepository.getProfileByUserId(req.user.id);
            if (!doctorProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor profile not found'
                });
            }
            
            const consultations = await consultationRepository.getDoctorConsultations(
                doctorProfile.id, 
                { status }
            );
            
            res.json({
                success: true,
                data: consultations
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get all consultations for the authenticated patient
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getPatientConsultations(req, res, next) {
        try {
            const { status } = req.query;
            
            if (req.user.role !== 'patient') {
                return res.status(403).json({
                    success: false,
                    error: 'Only patients can access their consultations'
                });
            }
            
            const patientProfile = await patientRepository.getProfileByUserId(req.user.id);
            if (!patientProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient profile not found'
                });
            }
            
            const consultations = await consultationRepository.getPatientConsultations(
                patientProfile.id, 
                { status }
            );
            
            res.json({
                success: true,
                data: consultations
            });
        } catch (error) {
            next(error);
        }
    }
};