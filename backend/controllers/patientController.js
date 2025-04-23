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
                emergency_contact_name, emergency_contact_phone 
            } = req.body;
            
            const updatedProfile = await patientRepository.updateProfile(userId, {
                date_of_birth,
                gender,
                blood_group,
                allergies,
                medical_history,
                emergency_contact_name,
                emergency_contact_phone
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
}

module.exports = new PatientController();
