const appointmentRepository = require('../repositories/appointmentRepository');
const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');
const symptomAnalysisService = require('../services/symptomAnalysisService');
const { ValidationError } = require('../utils/errors');

/**
 * Appointment controller - Handles appointment-related requests
 */
class AppointmentController {
    /**
     * Create a new appointment
     */
    async createAppointment(req, res, next) {
        try {
            const { 
                doctor_id, 
                appointment_date, 
                appointment_time, 
                appointment_type,
                notes,
                location
            } = req.body;
            
            // If request is from a patient, use their ID as the patient_id
            let patient_id;
            
            // Check role directly instead of using a method
            if (req.user && req.user.role === 'patient') {
                const patientProfile = await patientRepository.getProfileByUserId(req.user.id);
                if (!patientProfile) {
                    return res.status(404).json({
                        success: false,
                        error: 'Patient profile not found'
                    });
                }
                patient_id = patientProfile.id;
            } else {
                patient_id = req.body.patient_id;
            }

            if (!patient_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Patient ID is required'
                });
            }
            
            if (!doctor_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Doctor ID is required'
                });
            }
            
            if (!appointment_date || !appointment_time) {
                return res.status(400).json({
                    success: false,
                    error: 'Appointment date and time are required'
                });
            }
            
            const appointment = await appointmentRepository.createAppointment({
                patient_id,
                doctor_id,
                appointment_date,
                appointment_time,
                appointment_type,
                notes,
                location
            });
            
            res.status(201).json({
                success: true,
                message: 'Appointment created successfully',
                data: appointment
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            next(error);
        }
    }
    
    /**
     * Create appointment with symptom analysis
     * @param {Object} req - HTTP request object
     * @param {Object} res - HTTP response object
     * @param {Function} next - Express next function
     */
    async createWithSymptomAnalysis(req, res, next) {
        try {
            const { 
                appointment_date, 
                appointment_time, 
                patient_id, 
                doctor_id,
                appointment_type,
                location,
                notes,
                symptoms,
                patientInfo
            } = req.body;

            if (!symptoms) {
                throw new ValidationError('Symptoms are required for analysis');
            }

            if (!patient_id) {
                throw new ValidationError('Patient ID is required');
            }

            // Validate appointment data
            if (!appointment_date || !appointment_time) {
                throw new ValidationError('Appointment date and time are required');
            }

            const appointmentData = {
                patient_id,
                doctor_id, // Doctor may be automatically assigned based on symptom analysis
                appointment_date,
                appointment_time,
                appointment_type: appointment_type || 'in-person',
                location: location || '',
                notes: notes || '',
                status: 'pending'
            };

            const result = await symptomAnalysisService.createAppointmentWithSymptomAnalysis(
                appointmentData,
                symptoms,
                patientInfo || {}
            );

            res.status(201).json({
                success: true,
                message: 'Appointment created with symptom analysis',
                data: {
                    appointment: result.appointment,
                    analysis: {
                        possibleIllnesses: [
                            result.analysis.possible_illness_1,
                            result.analysis.possible_illness_2
                        ].filter(Boolean),
                        recommendedSpecialties: [
                            result.analysis.recommended_doctor_speciality_1,
                            result.analysis.recommended_doctor_speciality_2
                        ].filter(Boolean),
                        criticality: result.analysis.criticality,
                        assessment: result.analysis.assessment,
                        followUpQuestions: result.analysis.follow_up_questions
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update appointment with symptom analysis
     * @param {Object} req - HTTP request object
     * @param {Object} res - HTTP response object
     * @param {Function} next - Express next function
     */
    async updateWithSymptomAnalysis(req, res, next) {
        try {
            const { id } = req.params;
            const { symptoms, patientInfo } = req.body;

            if (!symptoms) {
                throw new ValidationError('Symptoms are required for analysis');
            }

            const result = await symptomAnalysisService.updateAppointmentWithSymptomAnalysis(
                id,
                symptoms,
                patientInfo || {}
            );

            res.status(200).json({
                success: true,
                message: 'Appointment updated with symptom analysis',
                data: {
                    appointment: result.appointment,
                    analysis: {
                        possibleIllnesses: [
                            result.analysis.possible_illness_1,
                            result.analysis.possible_illness_2
                        ].filter(Boolean),
                        recommendedSpecialties: [
                            result.analysis.recommended_doctor_speciality_1,
                            result.analysis.recommended_doctor_speciality_2
                        ].filter(Boolean),
                        criticality: result.analysis.criticality,
                        assessment: result.analysis.assessment,
                        followUpQuestions: result.analysis.follow_up_questions
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get symptom analysis for an existing appointment
     */
    async getSymptomAnalysis(req, res, next) {
        try {
            const { id } = req.params;
            
            const appointment = await appointmentRepository.getAppointmentById(id);
            
            if (!appointment) {
                throw new ValidationError('Appointment not found');
            }
            
            if (!appointment.symptoms) {
                return res.status(404).json({
                    success: false,
                    message: 'No symptom analysis found for this appointment',
                    data: null
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Symptom analysis retrieved',
                data: {
                    symptoms: appointment.symptoms,
                    analysis: {
                        possibleIllnesses: [
                            appointment.possible_illness_1,
                            appointment.possible_illness_2
                        ].filter(Boolean),
                        recommendedSpecialties: [
                            appointment.recommended_doctor_speciality_1,
                            appointment.recommended_doctor_speciality_2
                        ].filter(Boolean),
                        criticality: appointment.criticality,
                        symptomAnalysisJson: appointment.symptom_analysis_json ? 
                            JSON.parse(appointment.symptom_analysis_json) : 
                            {}
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Analyze symptoms without creating an appointment
     */
    async analyzeSymptoms(req, res, next) {
        try {
            const { symptoms, patientInfo } = req.body;
            
            if (!symptoms) {
                throw new ValidationError('Symptoms are required for analysis');
            }
            
            const analysisResult = await symptomAnalysisService.analyzeSymptoms(
                symptoms,
                patientInfo || {}
            );
            
            res.status(200).json({
                success: true,
                message: 'Symptoms analyzed successfully',
                data: {
                    possibleIllnesses: [
                        analysisResult.possible_illness_1,
                        analysisResult.possible_illness_2
                    ].filter(Boolean),
                    recommendedSpecialties: [
                        analysisResult.recommended_doctor_speciality_1,
                        analysisResult.recommended_doctor_speciality_2
                    ].filter(Boolean),
                    criticality: analysisResult.criticality,
                    assessment: analysisResult.assessment,
                    followUpQuestions: analysisResult.follow_up_questions
                }
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Find recommended doctors based on speciality from symptom analysis
     */
    async findRecommendedDoctors(req, res, next) {
        try {
            const { speciality } = req.params;
            
            if (!speciality) {
                throw new ValidationError('Medical speciality is required');
            }
            
            const doctors = await symptomAnalysisService.findRecommendedDoctors(speciality);
            
            res.status(200).json({
                success: true,
                message: 'Recommended doctors retrieved',
                data: doctors
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get an appointment by ID
     */
    async getAppointmentById(req, res, next) {
        try {
            const { appointmentId } = req.params;
            const appointment = await appointmentRepository.getAppointmentById(appointmentId);
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
            
            // Only allow access if user is related to the appointment (patient or doctor)
            const isAdmin = req.user && req.user.role === 'admin';
            const isPatientForAppointment = req.user && req.user.role === 'patient' && 
                                            appointment.patient?.user?.id === req.user.id;
            const isDoctorForAppointment = req.user && req.user.role === 'doctor' && 
                                          appointment.doctor?.user?.id === req.user.id;
                                          
            if (isAdmin || isPatientForAppointment || isDoctorForAppointment) {
                res.json({
                    success: true,
                    data: appointment
                });
            } else {
                res.status(403).json({
                    success: false,
                    error: 'You do not have permission to access this appointment'
                });
            }
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get all appointments for the authenticated patient
     */
    async getMyAppointments(req, res, next) {
        try {
            const { status } = req.query;
            const validStatuses = ['upcoming', 'completed', 'cancelled'];
            
            // Validate status if provided
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }
            
            // Make sure req.user exists
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            let appointments = [];
            const userRole = req.user.role || '';
            
            // Safely check if user is a patient using role instead of method
            if (userRole === 'patient') {
                try {
                    const patientProfile = await patientRepository.getProfileByUserId(req.user.id);
                    if (!patientProfile) {
                        return res.status(404).json({
                            success: false,
                            error: 'Patient profile not found'
                        });
                    }
                    
                    appointments = await appointmentRepository.getPatientAppointments(
                        patientProfile.id, 
                        { status }
                    );
                } catch (patientError) {
                    console.error('Error getting patient appointments:', patientError);
                    // Check if appointments table exists
                    return res.status(500).json({
                        success: false,
                        error: 'Could not retrieve patient appointments',
                        details: patientError.message
                    });
                }
            } 
            // Safely check if user is a doctor using role instead of method
            else if (userRole === 'doctor') {
                try {
                    const doctorProfile = await doctorRepository.getProfileByUserId(req.user.id);
                    if (!doctorProfile) {
                        return res.status(404).json({
                            success: false,
                            error: 'Doctor profile not found'
                        });
                    }
                    
                    appointments = await appointmentRepository.getDoctorAppointments(
                        doctorProfile.id, 
                        { status }
                    );
                } catch (doctorError) {
                    console.error('Error getting doctor appointments:', doctorError);
                    return res.status(500).json({
                        success: false,
                        error: 'Could not retrieve doctor appointments',
                        details: doctorError.message
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    error: 'Only patients and doctors can access their appointments'
                });
            }
            
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            console.error('getMyAppointments error:', error);
            next(error);
        }
    }
    
    /**
     * Get all appointments for a patient (for doctors and admins)
     */
    async getPatientAppointments(req, res, next) {
        try {
            const { patientId } = req.params;
            const { status } = req.query;
            
            const appointments = await appointmentRepository.getPatientAppointments(
                patientId, 
                { status }
            );
            
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get all appointments for a doctor (for admin use)
     */
    async getDoctorAppointments(req, res, next) {
        try {
            const { doctorId } = req.params;
            const { status } = req.query;
            
            const appointments = await appointmentRepository.getDoctorAppointments(
                doctorId, 
                { status }
            );
            
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Update an appointment
     */
    async updateAppointment(req, res, next) {
        try {
            const { appointmentId } = req.params;
            const appointment = await appointmentRepository.getAppointmentById(appointmentId);
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
            
            // Only allow updates if user is related to the appointment
            const isAdmin = req.user && req.user.role === 'admin';
            const isPatientForAppointment = req.user && req.user.role === 'patient' && 
                                            appointment.patient?.user?.id === req.user.id;
            const isDoctorForAppointment = req.user && req.user.role === 'doctor' && 
                                          appointment.doctor?.user?.id === req.user.id;
                                          
            if (isAdmin || isPatientForAppointment || isDoctorForAppointment) {
                
                const { 
                    appointment_date, 
                    appointment_time, 
                    appointment_type,
                    notes,
                    location
                } = req.body;
                
                // Patient can't change appointment status except to cancel
                let status = req.body.status;
                if (req.user.role === 'patient' && status && status !== 'cancelled') {
                    return res.status(403).json({
                        success: false,
                        error: 'Patients can only cancel appointments, not change their status'
                    });
                }
                
                const updatedAppointment = await appointmentRepository.updateAppointment(
                    appointmentId, 
                    {
                        appointment_date,
                        appointment_time,
                        status,
                        appointment_type,
                        notes,
                        location
                    }
                );
                
                res.json({
                    success: true,
                    message: 'Appointment updated successfully',
                    data: updatedAppointment
                });
            } else {
                res.status(403).json({
                    success: false,
                    error: 'You do not have permission to update this appointment'
                });
            }
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Cancel an appointment
     */
    async cancelAppointment(req, res, next) {
        try {
            const { appointmentId } = req.params;
            const appointment = await appointmentRepository.getAppointmentById(appointmentId);
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
            
            // Only allow cancellation if user is related to the appointment
            const isAdmin = req.user && req.user.role === 'admin';
            const isPatientForAppointment = req.user && req.user.role === 'patient' && 
                                            appointment.patient?.user?.id === req.user.id;
            const isDoctorForAppointment = req.user && req.user.role === 'doctor' && 
                                          appointment.doctor?.user?.id === req.user.id;
                                          
            if (isAdmin || isPatientForAppointment || isDoctorForAppointment) {
                
                const cancelledAppointment = await appointmentRepository.cancelAppointment(appointmentId);
                
                res.json({
                    success: true,
                    message: 'Appointment cancelled successfully',
                    data: cancelledAppointment
                });
            } else {
                res.status(403).json({
                    success: false,
                    error: 'You do not have permission to cancel this appointment'
                });
            }
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Complete an appointment (doctors only)
     */
    async completeAppointment(req, res, next) {
        try {
            const { appointmentId } = req.params;
            const appointment = await appointmentRepository.getAppointmentById(appointmentId);
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
            
            // Only allow completion if user is the appointment's doctor or an admin
            const isAdmin = req.user && req.user.role === 'admin';
            const isDoctorForAppointment = req.user && req.user.role === 'doctor' && 
                                          appointment.doctor?.user?.id === req.user.id;
                                          
            if (isAdmin || isDoctorForAppointment) {
                
                const completedAppointment = await appointmentRepository.completeAppointment(appointmentId);
                
                res.json({
                    success: true,
                    message: 'Appointment marked as completed',
                    data: completedAppointment
                });
            } else {
                res.status(403).json({
                    success: false,
                    error: 'Only doctors can mark appointments as completed'
                });
            }
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get available time slots for a doctor on a specific date
     */
    async getDoctorAvailability(req, res, next) {
        try {
            const { doctorId } = req.params;
            const { date } = req.query;
            
            if (!date) {
                return res.status(400).json({
                    success: false,
                    error: 'Date is required'
                });
            }
            
            // Check if doctor exists
            const doctor = await doctorRepository.getProfileById(doctorId);
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor not found'
                });
            }
            
            // Get doctor's appointments for the specified date
            const appointments = await appointmentRepository.getDoctorAppointments(doctorId, {
                date: date
            });
            
            // Generate time slots between 9 AM and 5 PM
            const allTimeSlots = [];
            for (let hour = 9; hour < 17; hour++) {
                allTimeSlots.push(`${hour}:00`);
                allTimeSlots.push(`${hour}:30`);
            }
            
            // Mark already booked slots
            const bookedTimeSlots = appointments
                .filter(appointment => appointment.status !== 'cancelled')
                .map(appointment => appointment.appointment_time);
            
            // Get available slots
            const availableSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot));
            
            res.json({
                success: true,
                data: {
                    date: date,
                    doctorId: doctorId,
                    available_slots: availableSlots,
                    booked_slots: bookedTimeSlots
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark appointment as missed
     */
    async markAsMissed(req, res, next) {
        try {
            const { id } = req.params;
            
            const appointment = await appointmentRepository.markAppointmentAsMissed(id);
            return res.status(200).json({
                success: true,
                message: 'Appointment marked as missed',
                data: { appointment }
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Manually trigger check for missed appointments
     * This is an administrative endpoint that can be used to force
     * a check for missed appointments
     */
    async checkMissedAppointments(req, res, next) {
        try {
            const appointmentScheduler = require('../services/appointmentScheduler');
            await appointmentScheduler.runMissedAppointmentCheck();
            
            return res.status(200).json({
                success: true,
                message: 'Missed appointment check completed',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark an appointment as missed
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    async markAppointmentAsMissed(req, res) {
        try {
            const { appointmentId } = req.params;
            
            // Validate appointmentId exists
            if (!appointmentId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Appointment ID is required' 
                });
            }
            
            // Get the appointment first to verify it exists and check permissions
            const appointment = await this.appointmentRepository.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Appointment not found' 
                });
            }
            
            // Check if the appointment is already completed, cancelled, or missed
            if (appointment.status !== 'upcoming') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot mark appointment as missed. Current status is ${appointment.status}` 
                });
            }
            
            // Mark the appointment as missed
            const updatedAppointment = await this.appointmentRepository.markAppointmentAsMissed(appointmentId);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Appointment marked as missed',
                data: updatedAppointment 
            });
        } catch (error) {
            console.error('Error marking appointment as missed:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error marking appointment as missed', 
                error: error.message 
            });
        }
    }
    
    /**
     * Check for missed appointments and mark them automatically
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    async checkMissedAppointments(req, res) {
        try {
            // Get bufferMinutes from query params or use default
            const bufferMinutes = req.query.bufferMinutes ? parseInt(req.query.bufferMinutes) : 15;
            
            const missedAppointments = await this.appointmentRepository.checkAndMarkMissedAppointments({
                bufferMinutes
            });
            
            return res.status(200).json({ 
                success: true, 
                message: `${missedAppointments.length} appointments marked as missed`,
                data: missedAppointments 
            });
        } catch (error) {
            console.error('Error checking missed appointments:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error checking missed appointments', 
                error: error.message 
            });
        }
    }

    /**
     * Mark appointment as missed
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    async markAppointmentAsMissed(req, res) {
        try {
            const { appointmentId } = req.params;
            
            // Validate appointment exists and can be marked as missed
            const appointment = await this.appointmentRepository.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({ message: 'Appointment not found' });
            }
            
            if (appointment.status !== 'upcoming') {
                return res.status(400).json({ 
                    message: `Cannot mark appointment as missed. Current status: ${appointment.status}` 
                });
            }
            
            const updatedAppointment = await this.appointmentRepository.markAppointmentAsMissed(appointmentId);
            
            // Send notification to patient that appointment was missed
            // This would call a notification service in a production app
            
            res.status(200).json({
                message: 'Appointment marked as missed',
                appointment: updatedAppointment
            });
        } catch (error) {
            console.error('Error marking appointment as missed:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    /**
     * Check for and process missed appointments
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    async checkForMissedAppointments(req, res) {
        try {
            const bufferMinutes = req.query.bufferMinutes ? parseInt(req.query.bufferMinutes) : 15;
            
            const missedAppointments = await this.appointmentRepository.checkAndMarkMissedAppointments({
                bufferMinutes
            });
            
            res.status(200).json({
                message: `${missedAppointments.length} appointments marked as missed`,
                missedAppointments
            });
        } catch (error) {
            console.error('Error checking for missed appointments:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new AppointmentController();