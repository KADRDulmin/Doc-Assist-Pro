/**
 * Appointment model
 */
class Appointment {
    constructor(data) {
        this.id = data.id;
        this.patient_id = data.patient_id;
        this.doctor_id = data.doctor_id;
        this.appointment_date = data.appointment_date;
        this.appointment_time = data.appointment_time;
        this.status = data.status || 'upcoming'; // upcoming, completed, cancelled, missed
        this.appointment_type = data.appointment_type || 'general';
        this.notes = data.notes || '';
        this.location = data.location || '';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.parent_appointment_id = data.parent_appointment_id || null; // For follow-ups and check-ups
        
        // Additional related data (not stored in database columns)
        this.patient = data.patient || null;
        this.doctor = data.doctor || null;
    }

    /**
     * Convert to JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            patient_id: this.patient_id,
            doctor_id: this.doctor_id,
            appointment_date: this.appointment_date,
            appointment_time: this.appointment_time,
            status: this.status,
            appointment_type: this.appointment_type,
            notes: this.notes,
            location: this.location,
            created_at: this.created_at,
            updated_at: this.updated_at,
            parent_appointment_id: this.parent_appointment_id,
            // Include patient data if available
            patient: this.patient ? {
                id: this.patient.id,
                user: this.patient.user ? {
                    first_name: this.patient.user.first_name,
                    last_name: this.patient.user.last_name,
                    email: this.patient.user.email,
                    phone: this.patient.user.phone
                } : null
            } : null,
            // Include doctor data if available
            doctor: this.doctor ? {
                id: this.doctor.id,
                specialization: this.doctor.specialization,
                user: this.doctor.user ? {
                    first_name: this.doctor.user.first_name,
                    last_name: this.doctor.user.last_name,
                    email: this.doctor.user.email,
                    phone: this.doctor.user.phone
                } : null
            } : null
        };
    }

    /**
     * Get valid appointment statuses
     * @returns {string[]} List of valid appointment statuses
     */
    static getValidStatuses() {
        return ['upcoming', 'completed', 'cancelled', 'missed'];
    }

    /**
     * Get valid appointment types
     * @returns {string[]} List of valid appointment types
     */
    static getValidTypes() {
        return ['general', 'follow-up', 'check-up', 'consultation', 'emergency'];
    }

    /**
     * Validate required fields
     */
    isValid() {
        return Boolean(
            this.patient_id && 
            this.doctor_id && 
            this.appointment_date && 
            this.appointment_time && 
            Appointment.getValidStatuses().includes(this.status)
        );
    }
}

module.exports = Appointment;