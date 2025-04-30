/**
 * Consultation model
 */
class Consultation {
    constructor(data) {
        this.id = data.id;
        this.appointment_id = data.appointment_id;
        this.doctor_id = data.doctor_id;
        this.patient_id = data.patient_id;
        this.status = data.status || 'in_progress'; // in_progress, completed, missed
        this.actual_start_time = data.actual_start_time;
        this.actual_end_time = data.actual_end_time || null;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Additional related data (not stored in database columns)
        this.patient = data.patient || null;
        this.doctor = data.doctor || null;
        this.appointment = data.appointment || null;
        this.medical_records = data.medical_records || [];
        this.prescriptions = data.prescriptions || [];
    }

    /**
     * Convert to JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            appointment_id: this.appointment_id,
            doctor_id: this.doctor_id,
            patient_id: this.patient_id,
            status: this.status,
            actual_start_time: this.actual_start_time,
            actual_end_time: this.actual_end_time,
            created_at: this.created_at,
            updated_at: this.updated_at,
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
            } : null,
            // Include appointment data if available
            appointment: this.appointment ? (
                typeof this.appointment.toJSON === 'function' ? 
                this.appointment.toJSON() : 
                this.appointment
            ) : null,
            // Include related records if available
            medical_records: this.medical_records && this.medical_records.length > 0 
                ? this.medical_records.map(record => 
                    typeof record.toJSON === 'function' ? record.toJSON() : record
                ) 
                : [],
            prescriptions: this.prescriptions && this.prescriptions.length > 0 
                ? this.prescriptions.map(prescription => 
                    typeof prescription.toJSON === 'function' ? prescription.toJSON() : prescription
                ) 
                : []
        };
    }

    /**
     * Get valid consultation statuses
     * @returns {string[]} List of valid consultation statuses
     */
    static getValidStatuses() {
        return ['in_progress', 'completed', 'missed'];
    }

    /**
     * Validate required fields
     */
    isValid() {
        return Boolean(
            this.appointment_id && 
            this.doctor_id && 
            this.patient_id && 
            Consultation.getValidStatuses().includes(this.status)
        );
    }
}

module.exports = Consultation;