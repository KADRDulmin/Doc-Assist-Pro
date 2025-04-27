const doctorRepository = require('../repositories/doctorRepository');
const authService = require('../services/authService');
// Import DoctorProfile directly since it's exported directly, not as a property
const DoctorProfile = require('../models/doctor-profile');
const feedbackRepository = require('../repositories/feedbackRepository');
const appointmentRepository = require('../repositories/appointmentRepository');
const patientRepository = require('../repositories/patientRepository');

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

    /**
     * Get nearby doctors for patients
     */
    async getNearbyDoctors(req, res, next) {
        try {
            const { latitude, longitude, specialty, maxDistance } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            // Get all doctors
            let doctors = await doctorRepository.getAllDoctors();
            
            // Filter by specialty if provided
            if (specialty) {
                doctors = doctors.filter(doctor => 
                    doctor.specialty && doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
                );
            }
            
            // If location parameters are provided, calculate and sort by distance
            if (latitude && longitude) {
                const userLocation = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude)
                };
                
                const distanceLimit = maxDistance ? parseFloat(maxDistance) : 50; // default to 50 miles/km
                
                // Calculate distance for each doctor and filter by max distance
                doctors = doctors
                    .map(doctor => {
                        if (doctor.latitude && doctor.longitude) {
                            const distance = this._calculateDistance(
                                userLocation.latitude, 
                                userLocation.longitude,
                                doctor.latitude,
                                doctor.longitude
                            );
                            return { ...doctor, distance };
                        }
                        return { ...doctor, distance: 999 }; // Unknown distance
                    })
                    .filter(doctor => doctor.distance <= distanceLimit)
                    .sort((a, b) => a.distance - b.distance);
            }
            
            // Add availability information
            const today = new Date().toISOString().split('T')[0];
            
            // Get ratings for all doctors in one query for performance
            const doctorIds = doctors.map(doctor => doctor.id);
            const ratingsMap = {};
            
            if (doctorIds.length > 0) {
                const ratings = await Promise.all(
                    doctorIds.map(id => feedbackRepository.getDoctorAverageRating(id))
                );
                
                doctorIds.forEach((id, index) => {
                    ratingsMap[id] = ratings[index];
                });
            }
            
            // Enhance doctors with availability and ratings
            const enhancedDoctors = await Promise.all(
                doctors.map(async (doctor) => {
                    // Check today's appointment availability
                    const appointments = await appointmentRepository.getDoctorAppointments(
                        doctor.id, { date: today }
                    );
                    
                    const bookedSlots = appointments
                        .filter(appt => appt.status !== 'cancelled')
                        .length;
                    
                    // Assuming 8 slots available per day
                    const totalSlots = 8; 
                    const availableToday = bookedSlots < totalSlots;
                    
                    return {
                        id: doctor.id,
                        name: `${doctor.user?.first_name || ''} ${doctor.user?.last_name || ''}`.trim(),
                        specialty: doctor.specialty || 'General Medicine',
                        rating: ratingsMap[doctor.id]?.averageRating || 0,
                        distance: doctor.distance ? `${doctor.distance.toFixed(1)} mi` : 'Unknown',
                        availableToday,
                        imageUrl: doctor.profile_image || null
                    };
                })
            );
            
            // Paginate results
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedDoctors = enhancedDoctors.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                data: paginatedDoctors,
                pagination: {
                    total: enhancedDoctors.length,
                    page,
                    limit,
                    pages: Math.ceil(enhancedDoctors.length / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lon1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lon2 - Longitude of point 2
     * @returns {number} Distance in miles
     */
    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3958.8; // Earth's radius in miles (6371 km for kilometers)
        const dLat = this._toRadians(lat2 - lat1);
        const dLon = this._toRadians(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }
    
    _toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get doctor dashboard data
     * Combines doctor profile with appointment counts and patient stats
     */
    async getDashboardData(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await doctorRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor profile not found'
                });
            }
            
            // Get today's appointments
            const today = new Date().toISOString().split('T')[0];
            const appointments = await appointmentRepository.getDoctorAppointments(profile.id, { date: today });
            
            // Get patient count - this can be optimized with a specific query
            const allAppointments = await appointmentRepository.getDoctorAppointments(profile.id);
            const uniquePatientIds = new Set();
            allAppointments.forEach(app => {
                if (app.patient_id) {
                    uniquePatientIds.add(app.patient_id);
                }
            });
            const patientCount = uniquePatientIds.size;
            
            // Get completed appointments count
            const completedAppointments = allAppointments.filter(app => app.status === 'completed').length;
            
            // Add these stats to the profile object for the frontend
            profile.patient_count = patientCount;
            profile.completed_appointments = completedAppointments;
            
            res.json({
                success: true,
                data: {
                    profile,
                    appointments,
                    stats: {
                        appointmentCount: appointments.length,
                        patientCount,
                        completedAppointments
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            next(error);
        }
    }
    
    /**
     * Get appointments for the authenticated doctor
     */
    async getMyAppointments(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await doctorRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor profile not found'
                });
            }
            
            const { status, date } = req.query;
            let options = {};
            
            if (status) {
                options.status = status;
            }
            
            if (date) {
                options.date = date;
            }
            
            const appointments = await appointmentRepository.getDoctorAppointments(profile.id, options);
            
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            console.error('Error fetching doctor appointments:', error);
            next(error);
        }
    }

    /**
     * Get patients for the authenticated doctor
     * Returns patients who had appointments with this doctor
     */
    async getMyPatients(req, res, next) {
        try {
            const userId = req.user.id;
            const { search } = req.query;
            
            const profile = await doctorRepository.getProfileByUserId(userId);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Doctor profile not found'
                });
            }
            
            // Get all appointments for this doctor
            const appointments = await appointmentRepository.getDoctorAppointments(profile.id);
            
            // Extract unique patient IDs
            const uniquePatientIds = [...new Set(appointments.map(app => app.patient_id))];
            
            // Get detailed patient information for each patient
            const patientsPromises = uniquePatientIds.map(patientId => 
                patientRepository.getProfileById(patientId)
            );
            
            let patients = await Promise.all(patientsPromises);
            
            // Filter out any null results (in case a patient was deleted)
            patients = patients.filter(patient => patient !== null);
            
            // Filter by search term if provided
            if (search) {
                const searchTerm = search.toLowerCase();
                patients = patients.filter(patient => 
                    (patient.user?.first_name && patient.user.first_name.toLowerCase().includes(searchTerm)) ||
                    (patient.user?.last_name && patient.user.last_name.toLowerCase().includes(searchTerm)) ||
                    (patient.user?.email && patient.user.email.toLowerCase().includes(searchTerm))
                );
            }
            
            // Add the count of appointments for each patient
            patients = patients.map(patient => {
                const patientAppointments = appointments.filter(app => app.patient_id === patient.id);
                const completedCount = patientAppointments.filter(app => app.status === 'completed').length;
                const cancelledCount = patientAppointments.filter(app => app.status === 'cancelled').length;
                const upcomingCount = patientAppointments.filter(app => app.status === 'upcoming').length;
                
                return {
                    ...patient,
                    appointment_count: patientAppointments.length,
                    completed_appointments: completedCount,
                    cancelled_appointments: cancelledCount,
                    upcoming_appointments: upcomingCount
                };
            });
            
            res.json({
                success: true,
                data: patients
            });
        } catch (error) {
            console.error('Error fetching doctor patients:', error);
            next(error);
        }
    }
}

module.exports = new DoctorController();
