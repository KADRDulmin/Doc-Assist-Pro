const doctorRepository = require('../repositories/doctorRepository');
const authService = require('../services/authService');
// Import DoctorProfile directly since it's exported directly, not as a property
const DoctorProfile = require('../models/doctor-profile');

/**
 * Doctor-specific controller
 */
class DoctorController {
    /**
     * Register a new doctor
     */
    async registerDoctor(req, res, next) {
        try {
            const { 
                email, password, first_name, last_name, phone,  // User data
                specialization, license_number, years_of_experience, education, bio, consultation_fee  // Doctor profile data
            } = req.body;
            
            console.log('Doctor registration request received:', {
                email,
                first_name,
                last_name,
                specialization,
                license_number
            });
            
            // Detailed request body logging for debugging
            console.log('Full doctor registration request body:', JSON.stringify(req.body, null, 2));
            
            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Email and password are required' 
                });
            }
            
            if (!specialization) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Specialization is required' 
                });
            }
            
            if (!license_number) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'License number is required' 
                });
            }
            
            // FIX: Get specializations directly from the DoctorProfile class
            // This fixes the "Cannot read properties of undefined" error
            const validSpecializations = DoctorProfile.getSpecializations();
            if (!validSpecializations.includes(specialization)) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Invalid specialization. Valid options are: ${validSpecializations.join(', ')}` 
                });
            }
            
            try {
                // Create doctor with both user and profile data
                const doctor = await authService.registerDoctor(
                    { email, password, first_name, last_name, phone },
                    { specialization, license_number, years_of_experience, education, bio, consultation_fee }
                );
                
                res.status(201).json({
                    success: true,
                    message: 'Doctor registered successfully',
                    data: doctor
                });
            } catch (serviceError) {
                console.error('Error in authService.registerDoctor:', serviceError);
                // Send more specific error status codes based on error type
                if (serviceError.message.includes('already exists')) {
                    return res.status(409).json({ success: false, error: serviceError.message });
                }
                throw serviceError; // Re-throw for the outer catch block
            }
        } catch (error) {
            console.error('Doctor registration error:', error);
            // Send error to the global error handler
            next(error);
        }
    }
    
    /**
     * Test doctor registration with simple response
     * This can help identify where things are breaking
     */
    async testRegisterDoctor(req, res) {
        try {
            const { 
                email, password, first_name, last_name, phone,
                specialization, license_number, years_of_experience, education, bio, consultation_fee
            } = req.body;
            
            console.log('Test doctor registration request received:', {
                email, first_name, last_name, specialization, license_number
            });
            
            // Basic validation
            if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
            if (!password) return res.status(400).json({ success: false, error: 'Password is required' });
            if (!specialization) return res.status(400).json({ success: false, error: 'Specialization is required' });
            if (!license_number) return res.status(400).json({ success: false, error: 'License number is required' });
            
            // Just return success without actual registration
            return res.status(200).json({
                success: true,
                message: 'Registration validation passed',
                data: {
                    email,
                    first_name,
                    last_name,
                    phone,
                    specialization,
                    license_number,
                    years_of_experience,
                    education,
                    bio,
                    consultation_fee
                }
            });
        } catch (error) {
            console.error('Test registration error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Test registration error',
                message: error.message
            });
        }
    }
    
    /**
     * Get doctor's own profile
     */
    async getMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await doctorRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor profile not found'
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
     * Update doctor's own profile
     */
    async updateMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { specialization, years_of_experience, education, bio, consultation_fee } = req.body;
            
            const updatedProfile = await doctorRepository.updateProfile(userId, {
                specialization, 
                years_of_experience,
                education,
                bio,
                consultation_fee
            });
            
            res.json({
                success: true,
                message: 'Doctor profile updated successfully',
                data: updatedProfile
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get all doctors (for patients and admins)
     */
    async getAllDoctors(req, res, next) {
        try {
            const { specialization, limit = 20, offset = 0 } = req.query;
            
            const doctors = await doctorRepository.getAllDoctors({
                specialization,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
            res.json({
                success: true,
                count: doctors.length,
                data: doctors
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get doctor by ID
     */
    async getDoctorById(req, res, next) {
        try {
            const { doctorId } = req.params;
            
            // The doctor profile stores the user ID, not the profile ID
            // So we need to find by doctor profile ID, not user ID
            const doctors = await doctorRepository.getAllDoctors();
            const doctor = doctors.find(doc => doc.id === parseInt(doctorId));
            
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor not found'
                });
            }
            
            res.json({
                success: true,
                data: doctor
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DoctorController();
