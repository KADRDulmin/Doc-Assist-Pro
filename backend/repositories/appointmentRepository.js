const { pool } = require('../config/database');
const Appointment = require('../models/appointment');
const PatientProfile = require('../models/patient-profile');
const DoctorProfile = require('../models/doctor-profile');
const User = require('../models/user');
const memoryStore = require('../utils/memoryStore');

/**
 * Appointment Repository - Handles appointment data access
 */
class AppointmentRepository {
    /**
     * Create a new appointment
     */
    async createAppointment(appointmentData) {
        try {
            const { 
                patient_id, 
                doctor_id, 
                appointment_date, 
                appointment_time, 
                status = 'upcoming',
                appointment_type,
                notes = '',
                location = ''
            } = appointmentData;
            
            const client = await pool.connect();
            
            try {
                console.log(`Creating appointment: Patient ID: ${patient_id}, Doctor ID: ${doctor_id}`);
                
                // Verify patient and doctor exist
                const patientResult = await client.query(
                    "SELECT 1 FROM patient_profiles WHERE id = $1",
                    [patient_id]
                );
                
                if (patientResult.rows.length === 0) {
                    throw new Error(`Patient with ID ${patient_id} not found`);
                }
                
                const doctorResult = await client.query(
                    "SELECT 1 FROM doctor_profiles WHERE id = $1",
                    [doctor_id]
                );
                
                if (doctorResult.rows.length === 0) {
                    throw new Error(`Doctor with ID ${doctor_id} not found`);
                }
                
                const result = await client.query(
                    `INSERT INTO appointments (
                        patient_id, doctor_id, appointment_date, appointment_time, 
                        status, appointment_type, notes, location
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                    [
                        patient_id, 
                        doctor_id, 
                        appointment_date, 
                        appointment_time,
                        status,
                        appointment_type,
                        notes,
                        location
                    ]
                );
                
                return new Appointment(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._createAppointmentInMemory(appointmentData);
            }
            throw error;
        }
    }

    /**
     * Create appointment with symptom analysis
     * @param {Object} appointmentData - Basic appointment data
     * @param {Object} symptomData - Symptom analysis data
     * @returns {Promise<Appointment>} Created appointment
     */
    async createAppointmentWithSymptoms(appointmentData, symptomData) {
        try {
            const client = await pool.connect();
            
            try {
                console.log(`Creating appointment with symptoms analysis`);
                
                // Verify patient exists
                const patientResult = await client.query(
                    "SELECT 1 FROM patient_profiles WHERE id = $1",
                    [appointmentData.patient_id]
                );
                
                if (patientResult.rows.length === 0) {
                    throw new Error(`Patient with ID ${appointmentData.patient_id} not found`);
                }
                
                // If doctor_id is provided, verify doctor exists
                if (appointmentData.doctor_id) {
                    const doctorResult = await client.query(
                        "SELECT 1 FROM doctor_profiles WHERE id = $1",
                        [appointmentData.doctor_id]
                    );
                    
                    if (doctorResult.rows.length === 0) {
                        throw new Error(`Doctor with ID ${appointmentData.doctor_id} not found`);
                    }
                }
                
                const { 
                    patient_id, 
                    doctor_id, 
                    appointment_date, 
                    appointment_time, 
                    status = 'upcoming',
                    appointment_type,
                    notes = '',
                    location = ''
                } = appointmentData;
                
                const {
                    symptoms,
                    possible_illness_1,
                    possible_illness_2,
                    recommended_doctor_speciality_1,
                    recommended_doctor_speciality_2,
                    criticality,
                    symptom_analysis_json
                } = symptomData;
                
                const result = await client.query(
                    `INSERT INTO appointments (
                        patient_id, doctor_id, appointment_date, appointment_time, 
                        status, appointment_type, notes, location,
                        symptoms, possible_illness_1, possible_illness_2,
                        recommended_doctor_speciality_1, recommended_doctor_speciality_2,
                        criticality
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
                    RETURNING *`,
                    [
                        patient_id, 
                        doctor_id, 
                        appointment_date, 
                        appointment_time,
                        status,
                        appointment_type,
                        notes,
                        location,
                        symptoms,
                        possible_illness_1,
                        possible_illness_2,
                        recommended_doctor_speciality_1,
                        recommended_doctor_speciality_2,
                        criticality
                    ]
                );
                
                return new Appointment(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._createAppointmentWithSymptomsInMemory(appointmentData, symptomData);
            }
            throw error;
        }
    }

    /**
     * Update appointment with symptom analysis results
     */
    async updateAppointmentWithSymptomAnalysis(id, symptomData) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if appointment exists
                const checkResult = await client.query(
                    'SELECT 1 FROM appointments WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Appointment with ID ${id} not found`);
                }
                
                const {
                    symptoms,
                    possible_illness_1,
                    possible_illness_2,
                    recommended_doctor_speciality_1,
                    recommended_doctor_speciality_2,
                    criticality
                } = symptomData;
                
                const result = await client.query(
                    `UPDATE appointments SET
                        symptoms = COALESCE($1, symptoms),
                        possible_illness_1 = COALESCE($2, possible_illness_1),
                        possible_illness_2 = COALESCE($3, possible_illness_2),
                        recommended_doctor_speciality_1 = COALESCE($4, recommended_doctor_speciality_1),
                        recommended_doctor_speciality_2 = COALESCE($5, recommended_doctor_speciality_2),
                        criticality = COALESCE($6, criticality),
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $7
                     RETURNING *`,
                    [
                        symptoms,
                        possible_illness_1,
                        possible_illness_2,
                        recommended_doctor_speciality_1,
                        recommended_doctor_speciality_2,
                        criticality,
                        id
                    ]
                );
                
                return new Appointment(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateAppointmentWithSymptomAnalysisInMemory(id, symptomData);
            }
            throw error;
        }
    }

    /**
     * Get doctors by speciality - useful for recommending doctors based on symptom analysis
     */
    async getDoctorsBySpeciality(speciality, limit = 5) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE LOWER(dp.specialization) LIKE LOWER($1)
                     LIMIT $2`,
                    [`%${speciality}%`, limit]
                );
                
                return result.rows.map(row => {
                    const doctor = new DoctorProfile(row);
                    doctor.user = new User({
                        id: row.user_id,
                        email: row.email,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        role: row.role,
                        phone: row.phone
                    });
                    return doctor;
                });
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, unable to get doctors by speciality');
                return [];
            }
            throw error;
        }
    }

    /**
     * Get appointment by ID
     */
    async getAppointmentById(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `SELECT a.*
                     FROM appointments a
                     WHERE a.id = $1`,
                    [id]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                const appointment = new Appointment(result.rows[0]);
                
                // Fetch patient and doctor information
                const patientResult = await client.query(
                    `SELECT pp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM patient_profiles pp
                     JOIN users u ON pp.user_id = u.id
                     WHERE pp.id = $1`,
                    [appointment.patient_id]
                );
                
                if (patientResult.rows.length > 0) {
                    const patientRow = patientResult.rows[0];
                    const patient = new PatientProfile(patientRow);
                    
                    patient.user = new User({
                        id: patientRow.user_id,
                        email: patientRow.email,
                        first_name: patientRow.first_name,
                        last_name: patientRow.last_name,
                        role: patientRow.role,
                        phone: patientRow.phone
                    });
                    
                    appointment.patient = patient;
                }
                
                const doctorResult = await client.query(
                    `SELECT dp.*, 
                        u.id as user_id, u.email, u.first_name, u.last_name, 
                        u.role, u.phone
                     FROM doctor_profiles dp
                     JOIN users u ON dp.user_id = u.id
                     WHERE dp.id = $1`,
                    [appointment.doctor_id]
                );
                
                if (doctorResult.rows.length > 0) {
                    const doctorRow = doctorResult.rows[0];
                    const doctor = new DoctorProfile(doctorRow);
                    
                    doctor.user = new User({
                        id: doctorRow.user_id,
                        email: doctorRow.email,
                        first_name: doctorRow.first_name,
                        last_name: doctorRow.last_name,
                        role: doctorRow.role,
                        phone: doctorRow.phone
                    });
                    
                    appointment.doctor = doctor;
                }
                
                return appointment;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getAppointmentByIdInMemory(id);
            }
            throw error;
        }
    }

    /**
     * Get appointments for a patient
     */
    async getPatientAppointments(patientId, options = {}) {
        try {
            const { status = null, limit = 100, offset = 0 } = options;
            const client = await pool.connect();
            
            try {
                // Check if the appointments table exists
                const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'appointments'
                    );
                `);
                
                if (!tableCheck.rows[0].exists) {
                    console.warn('Appointments table does not exist yet');
                    // Return empty array if table doesn't exist
                    return [];
                }
                
                let query = `
                    SELECT a.*
                    FROM appointments a
                    WHERE a.patient_id = $1
                `;
                
                const params = [patientId];
                
                if (status) {
                    params.push(status);
                    query += ` AND a.status = $${params.length}`;
                }
                
                query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC
                           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
                
                params.push(limit, offset);
                
                const result = await client.query(query, params);
                
                return await this._populateAppointmentsWithDetails(client, result.rows);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error in getPatientAppointments:', error.message);
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getPatientAppointmentsInMemory(patientId, options);
            }
            throw error;
        }
    }

    /**
     * Get appointments for a doctor
     */
    async getDoctorAppointments(doctorId, options = {}) {
        try {
            const { status = null, date = null, limit = 100, offset = 0 } = options;
            const client = await pool.connect();
            
            try {
                let query = `
                    SELECT a.*
                    FROM appointments a
                    WHERE a.doctor_id = $1
                `;
                
                const params = [doctorId];
                
                // Add status filter if provided
                if (status) {
                    params.push(status);
                    query += ` AND a.status = $${params.length}`;
                }
                
                // Add date filter if provided
                if (date) {
                    params.push(date);
                    query += ` AND a.appointment_date = $${params.length}`;
                }
                
                // Special case for "today" status
                if (status === 'today') {
                    const today = new Date().toISOString().split('T')[0];
                    params.push(today);
                    query = query.replace('a.status = $2', `a.appointment_date = $${params.length}`);
                }
                
                query += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC
                           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
                
                params.push(limit, offset);
                
                const result = await client.query(query, params);
                
                return await this._populateAppointmentsWithDetails(client, result.rows);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._getDoctorAppointmentsInMemory(doctorId, options);
            }
            throw error;
        }
    }

    /**
     * Update appointment
     */
    async updateAppointment(id, appointmentData) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if appointment exists
                const checkResult = await client.query(
                    'SELECT 1 FROM appointments WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Appointment with ID ${id} not found`);
                }
                
                const { 
                    appointment_date, 
                    appointment_time, 
                    status,
                    appointment_type,
                    notes,
                    location
                } = appointmentData;
                
                const result = await client.query(
                    `UPDATE appointments SET
                        appointment_date = COALESCE($1, appointment_date),
                        appointment_time = COALESCE($2, appointment_time),
                        status = COALESCE($3, status),
                        appointment_type = COALESCE($4, appointment_type),
                        notes = COALESCE($5, notes),
                        location = COALESCE($6, location),
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $7
                     RETURNING *`,
                    [
                        appointment_date,
                        appointment_time,
                        status,
                        appointment_type,
                        notes,
                        location,
                        id
                    ]
                );
                
                return new Appointment(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateAppointmentInMemory(id, appointmentData);
            }
            throw error;
        }
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(id) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if appointment exists
                const checkResult = await client.query(
                    'SELECT 1 FROM appointments WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Appointment with ID ${id} not found`);
                }
                
                const result = await client.query(
                    `UPDATE appointments SET
                        status = 'cancelled',
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1
                     RETURNING *`,
                    [id]
                );
                
                return new Appointment(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateAppointmentInMemory(id, { status: 'cancelled' });
            }
            throw error;
        }
    }

    /**
     * Complete appointment
     */
    async completeAppointment(id) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if appointment exists
                const checkResult = await client.query(
                    'SELECT 1 FROM appointments WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Appointment with ID ${id} not found`);
                }
                
                const result = await client.query(
                    `UPDATE appointments SET
                        status = 'completed',
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1
                     RETURNING *`,
                    [id]
                );
                
                return new Appointment(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateAppointmentInMemory(id, { status: 'completed' });
            }
            throw error;
        }
    }

    /**
     * Mark appointment as missed
     */
    async markAppointmentAsMissed(id) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if appointment exists
                const checkResult = await client.query(
                    'SELECT 1 FROM appointments WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    throw new Error(`Appointment with ID ${id} not found`);
                }
                
                const result = await client.query(
                    `UPDATE appointments SET
                        status = 'missed',
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1
                     RETURNING *`,
                    [id]
                );
                
                return new Appointment(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateAppointmentInMemory(id, { status: 'missed' });
            }
            throw error;
        }
    }

    /**
     * Check for missed appointments
     * Finds all 'upcoming' appointments whose date and time have passed
     * and marks them as 'missed'
     */
    async checkAndMarkMissedAppointments() {
        try {
            const client = await pool.connect();
            
            try {
                const currentDate = new Date().toISOString().split('T')[0];
                const currentTime = new Date().toTimeString().split(' ')[0].slice(0, 5);
                
                console.log(`Checking for missed appointments. Current date: ${currentDate}, time: ${currentTime}`);
                
                // Find all upcoming appointments that have passed
                const result = await client.query(
                    `SELECT id FROM appointments 
                     WHERE status = 'upcoming'
                     AND (appointment_date < $1 
                          OR (appointment_date = $1 AND appointment_time < $2))`,
                    [currentDate, currentTime]
                );
                
                if (result.rows.length === 0) {
                    console.log('No missed appointments found');
                    return [];
                }
                
                console.log(`Found ${result.rows.length} missed appointments`);
                
                // Mark all found appointments as missed
                const missedAppointments = [];
                for (const row of result.rows) {
                    const missedAppointment = await this.markAppointmentAsMissed(row.id);
                    missedAppointments.push(missedAppointment);
                }
                
                return missedAppointments;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error checking for missed appointments:', error);
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, unable to check for missed appointments');
                return [];
            }
            throw error;
        }
    }

    /**
     * Helper method to populate appointments with doctor and patient details
     */
    async _populateAppointmentsWithDetails(client, rows) {
        if (rows.length === 0) return [];
        
        const appointmentIds = rows.map(row => row.id);
        
        // Get all patient and doctor IDs from the appointments
        const patientIds = [...new Set(rows.map(row => row.patient_id))];
        const doctorIds = [...new Set(rows.map(row => row.doctor_id))];
        
        // Fetch all patients in one query
        const patientsQuery = `
            SELECT pp.*, 
                u.id as user_id, u.email, u.first_name, u.last_name, 
                u.role, u.phone
            FROM patient_profiles pp
            JOIN users u ON pp.user_id = u.id
            WHERE pp.id = ANY($1)
        `;
        const patientsResult = await client.query(patientsQuery, [patientIds]);
        const patientsMap = new Map();
        
        patientsResult.rows.forEach(row => {
            const patient = new PatientProfile(row);
            patient.user = new User({
                id: row.user_id,
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                role: row.role,
                phone: row.phone
            });
            patientsMap.set(patient.id, patient);
        });
        
        // Fetch all doctors in one query
        const doctorsQuery = `
            SELECT dp.*, 
                u.id as user_id, u.email, u.first_name, u.last_name, 
                u.role, u.phone
            FROM doctor_profiles dp
            JOIN users u ON dp.user_id = u.id
            WHERE dp.id = ANY($1)
        `;
        const doctorsResult = await client.query(doctorsQuery, [doctorIds]);
        const doctorsMap = new Map();
        
        doctorsResult.rows.forEach(row => {
            const doctor = new DoctorProfile(row);
            doctor.user = new User({
                id: row.user_id,
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                role: row.role,
                phone: row.phone
            });
            doctorsMap.set(doctor.id, doctor);
        });
        
        // Create and populate appointments
        return rows.map(row => {
            const appointment = new Appointment(row);
            appointment.patient = patientsMap.get(row.patient_id) || null;
            appointment.doctor = doctorsMap.get(row.doctor_id) || null;
            return appointment;
        });
    }

    /**
     * Helper method to check for connection errors
     */
    _isConnectionError(error) {
        return error.message.includes('connect ECONNREFUSED') || 
               error.message.includes('Connection terminated unexpectedly') ||
               error.message.includes('connection to server') ||
               error.message.includes('Connection refused');
    }

    /* IN-MEMORY STORAGE METHODS */
    
    /**
     * Create appointment in memory
     */
    _createAppointmentInMemory(appointmentData) {
        console.log(`Using in-memory storage for appointment creation`);
        
        const { 
            patient_id, 
            doctor_id, 
            appointment_date, 
            appointment_time, 
            status = 'upcoming',
            appointment_type,
            notes = '',
            location = ''
        } = appointmentData;
        
        // Check if patient exists in memory store
        const patientExists = memoryStore.patientProfiles.some(p => p.id === parseInt(patient_id));
        if (!patientExists) {
            throw new Error(`Patient with ID ${patient_id} not found`);
        }
        
        // Check if doctor exists in memory store
        const doctorExists = memoryStore.doctorProfiles.some(d => d.id === parseInt(doctor_id));
        if (!doctorExists) {
            throw new Error(`Doctor with ID ${doctor_id} not found`);
        }
        
        // Initialize appointments array if it doesn't exist
        if (!memoryStore.appointments) {
            memoryStore.appointments = [];
        }
        
        const newAppointment = {
            id: memoryStore.appointments.length + 1,
            patient_id: parseInt(patient_id),
            doctor_id: parseInt(doctor_id),
            appointment_date,
            appointment_time,
            status,
            appointment_type,
            notes,
            location,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        memoryStore.appointments.push(newAppointment);
        
        return new Appointment(newAppointment);
    }
    
    /**
     * Create appointment with symptoms in memory
     */
    _createAppointmentWithSymptomsInMemory(appointmentData, symptomData) {
        console.log(`Using in-memory storage for appointment creation with symptoms`);
        
        const { 
            patient_id, 
            doctor_id, 
            appointment_date, 
            appointment_time, 
            status = 'upcoming',
            appointment_type,
            notes = '',
            location = ''
        } = appointmentData;
        
        // Check if patient exists in memory store
        const patientExists = memoryStore.patientProfiles.some(p => p.id === parseInt(patient_id));
        if (!patientExists) {
            throw new Error(`Patient with ID ${patient_id} not found`);
        }
        
        // Check if doctor exists in memory store if doctor_id is provided
        if (doctor_id) {
            const doctorExists = memoryStore.doctorProfiles.some(d => d.id === parseInt(doctor_id));
            if (!doctorExists) {
                throw new Error(`Doctor with ID ${doctor_id} not found`);
            }
        }
        
        // Initialize appointments array if it doesn't exist
        if (!memoryStore.appointments) {
            memoryStore.appointments = [];
        }
        
        const newAppointment = {
            id: memoryStore.appointments.length + 1,
            patient_id: parseInt(patient_id),
            doctor_id: doctor_id ? parseInt(doctor_id) : null,
            appointment_date,
            appointment_time,
            status,
            appointment_type,
            notes,
            location,
            ...symptomData,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        memoryStore.appointments.push(newAppointment);
        
        return new Appointment(newAppointment);
    }
    
    /**
     * Get appointment by ID from memory
     */
    _getAppointmentByIdInMemory(id) {
        if (!memoryStore.appointments) return null;
        
        const appointment = memoryStore.appointments.find(a => a.id === parseInt(id));
        if (!appointment) return null;
        
        const result = new Appointment(appointment);
        
        // Add related patient data
        const patient = memoryStore.patientProfiles.find(p => p.id === appointment.patient_id);
        if (patient) {
            const patientUser = memoryStore.users.find(u => u.id === patient.user_id);
            if (patientUser) {
                const patientProfile = new PatientProfile(patient);
                patientProfile.user = new User(patientUser);
                result.patient = patientProfile;
            }
        }
        
        // Add related doctor data
        const doctor = memoryStore.doctorProfiles.find(d => d.id === appointment.doctor_id);
        if (doctor) {
            const doctorUser = memoryStore.users.find(u => u.id === doctor.user_id);
            if (doctorUser) {
                const doctorProfile = new DoctorProfile(doctor);
                doctorProfile.user = new User(doctorUser);
                result.doctor = doctorProfile;
            }
        }
        
        return result;
    }
    
    /**
     * Get patient appointments from memory
     */
    _getPatientAppointmentsInMemory(patientId, options = {}) {
        if (!memoryStore.appointments) return [];
        
        const { status = null } = options;
        
        let appointments = memoryStore.appointments.filter(a => a.patient_id === parseInt(patientId));
        
        if (status) {
            appointments = appointments.filter(a => a.status === status);
        }
        
        // Sort by date and time descending
        appointments.sort((a, b) => {
            const dateComparison = new Date(b.appointment_date) - new Date(a.appointment_date);
            if (dateComparison !== 0) return dateComparison;
            return b.appointment_time.localeCompare(a.appointment_time);
        });
        
        return appointments.map(appointment => {
            const result = new Appointment(appointment);
            
            // Add related doctor data
            const doctor = memoryStore.doctorProfiles.find(d => d.id === appointment.doctor_id);
            if (doctor) {
                const doctorUser = memoryStore.users.find(u => u.id === doctor.user_id);
                if (doctorUser) {
                    const doctorProfile = new DoctorProfile(doctor);
                    doctorProfile.user = new User(doctorUser);
                    result.doctor = doctorProfile;
                }
            }
            
            // Add related patient data
            const patient = memoryStore.patientProfiles.find(p => p.id === appointment.patient_id);
            if (patient) {
                const patientUser = memoryStore.users.find(u => u.id === patient.user_id);
                if (patientUser) {
                    const patientProfile = new PatientProfile(patient);
                    patientProfile.user = new User(patientUser);
                    result.patient = patientProfile;
                }
            }
            
            return result;
        });
    }
    
    /**
     * Get doctor appointments from memory
     */
    _getDoctorAppointmentsInMemory(doctorId, options = {}) {
        if (!memoryStore.appointments) return [];
        
        const { status = null } = options;
        
        let appointments = memoryStore.appointments.filter(a => a.doctor_id === parseInt(doctorId));
        
        if (status) {
            appointments = appointments.filter(a => a.status === status);
        }
        
        // Sort by date and time descending
        appointments.sort((a, b) => {
            const dateComparison = new Date(b.appointment_date) - new Date(a.appointment_date);
            if (dateComparison !== 0) return dateComparison;
            return b.appointment_time.localeCompare(a.appointment_time);
        });
        
        return appointments.map(appointment => {
            const result = new Appointment(appointment);
            
            // Add related doctor data
            const doctor = memoryStore.doctorProfiles.find(d => d.id === appointment.doctor_id);
            if (doctor) {
                const doctorUser = memoryStore.users.find(u => u.id === doctor.user_id);
                if (doctorUser) {
                    const doctorProfile = new DoctorProfile(doctor);
                    doctorProfile.user = new User(doctorUser);
                    result.doctor = doctorProfile;
                }
            }
            
            // Add related patient data
            const patient = memoryStore.patientProfiles.find(p => p.id === appointment.patient_id);
            if (patient) {
                const patientUser = memoryStore.users.find(u => u.id === patient.user_id);
                if (patientUser) {
                    const patientProfile = new PatientProfile(patient);
                    patientProfile.user = new User(patientUser);
                    result.patient = patientProfile;
                }
            }
            
            return result;
        });
    }
    
    /**
     * Update appointment in memory
     */
    _updateAppointmentInMemory(id, appointmentData) {
        if (!memoryStore.appointments) throw new Error(`Appointment with ID ${id} not found`);
        
        const index = memoryStore.appointments.findIndex(a => a.id === parseInt(id));
        if (index === -1) throw new Error(`Appointment with ID ${id} not found`);
        
        const oldAppointment = memoryStore.appointments[index];
        const updatedAppointment = {
            ...oldAppointment,
            ...appointmentData,
            id: oldAppointment.id,  // Ensure ID doesn't change
            updated_at: new Date()
        };
        
        memoryStore.appointments[index] = updatedAppointment;
        
        return this._getAppointmentByIdInMemory(id);
    }
    
    /**
     * Update appointment with symptom analysis in memory
     */
    _updateAppointmentWithSymptomAnalysisInMemory(id, symptomData) {
        if (!memoryStore.appointments) throw new Error(`Appointment with ID ${id} not found`);
        
        const index = memoryStore.appointments.findIndex(a => a.id === parseInt(id));
        if (index === -1) throw new Error(`Appointment with ID ${id} not found`);
        
        const oldAppointment = memoryStore.appointments[index];
        const updatedAppointment = {
            ...oldAppointment,
            ...symptomData,
            id: oldAppointment.id,  // Ensure ID doesn't change
            updated_at: new Date()
        };
        
        memoryStore.appointments[index] = updatedAppointment;
        
        return this._getAppointmentByIdInMemory(id);
    }
}

module.exports = new AppointmentRepository();