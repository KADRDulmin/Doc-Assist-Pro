const patientRepository = require('../repositories/patientRepository');
const authService = require('../services/authService');

/**
 * Patient-specific controller
 */
class PatientController {
    /**
     * Register a new patient
     */
    async registerPatient(req, res, next) {
        try {
            const { 
                email, password, first_name, last_name, phone,  // User data
                date_of_birth, gender, blood_group, allergies, medical_history,  // Patient profile data
                emergency_contact_name, emergency_contact_phone
            } = req.body;
            
            // Create patient with both user and profile data
            const patient = await authService.registerPatient(
                { email, password, first_name, last_name, phone },
                { date_of_birth, gender, blood_group, allergies, medical_history, 
                  emergency_contact_name, emergency_contact_phone }
            );
            
            res.status(201).json({
                success: true,
                message: 'Patient registered successfully',
                data: patient
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get patient's own profile
     */
    async getMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await patientRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient profile not found'
                });
            }
            
            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Update patient's own profile
     */
    async updateMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { 
                date_of_birth, gender, blood_group, allergies, medical_history,
                emergency_contact_name, emergency_contact_phone,
                latitude, longitude, address
            } = req.body;
            
            const updatedProfile = await patientRepository.updateProfile(userId, {
                date_of_birth,
                gender,
                blood_group,
                allergies,
                medical_history,
                emergency_contact_name,
                emergency_contact_phone,
                latitude,
                longitude,
                address
            });
            
            res.json({
                success: true,
                message: 'Patient profile updated successfully',
                data: updatedProfile
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get patient by ID (for doctors and admins)
     */
    async getPatientById(req, res, next) {
        try {
            const { patientId } = req.params;
            
            // First get the patient profile
            const profile = await patientRepository.getProfileByUserId(patientId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient not found'
                });
            }
            
            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get dashboard data for the patient
     */
    async getDashboardData(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await patientRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient profile not found'
                });
            }

            // Get repositories for fetching related data
            const appointmentRepository = require('../repositories/appointmentRepository');
            const doctorRepository = require('../repositories/doctorRepository');
            const feedbackRepository = require('../repositories/feedbackRepository');
            
            // Get upcoming appointments
            const upcomingAppointments = await appointmentRepository.getPatientAppointments(
                profile.id, 
                { status: 'upcoming', limit: 3 }
            );
            
            // Get recently visited doctors
            const recentAppointments = await appointmentRepository.getPatientAppointments(
                profile.id,
                { status: 'completed', limit: 5 }
            );
            
            const recentDoctorIds = [...new Set(recentAppointments.map(app => app.doctor_id))];
            const recentDoctors = await Promise.all(
                recentDoctorIds.slice(0, 3).map(id => doctorRepository.getProfileById(id))
            );
            
            // Calculate number of days to next appointment
            let nextAppointmentDate = null;
            if (upcomingAppointments.length > 0) {
                const nextAppt = upcomingAppointments[0];
                nextAppointmentDate = nextAppt.appointment_date;
            }
            
            // Get number of active prescriptions
            const prescriptions = await patientRepository.getPatientPrescriptions(profile.id);
            const activePrescriptions = prescriptions.filter(p => p.status === 'active').length;
            
            // Get last checkup date
            let lastCheckupDate = null;
            const checkupAppointments = recentAppointments.filter(a => 
                a.appointment_type?.toLowerCase().includes('checkup') ||
                a.appointment_type?.toLowerCase().includes('check-up')
            );
            
            if (checkupAppointments.length > 0) {
                lastCheckupDate = checkupAppointments[0].appointment_date;
            }
            
            res.json({
                success: true,
                data: {
                    profile: {
                        name: `${profile.user.first_name} ${profile.user.last_name}`,
                        age: profile.getAge(),
                        nextAppointment: nextAppointmentDate
                    },
                    upcomingAppointments: upcomingAppointments,
                    stats: {
                        activePrescriptions,
                        lastCheckupDate
                    },
                    recentDoctors
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get patient's medical records
     */
    async getMedicalRecords(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await patientRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient profile not found'
                });
            }

            // Get medical records for the patient
            const medicalRecords = await patientRepository.getPatientMedicalRecords(profile.id);
            
            res.json({
                success: true,
                data: medicalRecords
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific medical record by ID
     */
    async getMedicalRecordById(req, res, next) {
        try {
            const userId = req.user.id;
            const { recordId } = req.params;
            
            const profile = await patientRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient profile not found'
                });
            }

            // Get the specific medical record
            const medicalRecord = await patientRepository.getMedicalRecordById(recordId);
            
            // Check if record exists and belongs to this patient
            if (!medicalRecord) {
                return res.status(404).json({
                    success: false,
                    error: 'Medical record not found'
                });
            }
            
            // Check if the record belongs to the requesting patient
            if (medicalRecord.patient_id !== profile.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this medical record'
                });
            }
            
            res.json({
                success: true,
                data: medicalRecord
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PatientController();
