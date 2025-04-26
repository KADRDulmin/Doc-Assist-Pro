/**
 * Feedback model
 */
class Feedback {
    constructor(data) {
        this.id = data.id;
        this.patient_id = data.patient_id;
        this.doctor_id = data.doctor_id;
        this.appointment_id = data.appointment_id || null;
        this.rating = data.rating || 0;
        this.comment = data.comment || '';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Additional related data (not stored in database columns)
        this.patient = data.patient || null;
        this.doctor = data.doctor || null;
        this.appointment = data.appointment || null;
    }

    /**
     * Convert to JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            patient_id: this.patient_id,
            doctor_id: this.doctor_id,
            appointment_id: this.appointment_id,
            rating: this.rating,
            comment: this.comment,
            created_at: this.created_at,
            updated_at: this.updated_at,
            // Include patient data if available
            patient: this.patient ? {
                id: this.patient.id,
                user: this.patient.user ? {
                    first_name: this.patient.user.first_name,
                    last_name: this.patient.user.last_name
                } : null
            } : null,
            // Include doctor data if available
            doctor: this.doctor ? {
                id: this.doctor.id,
                specialization: this.doctor.specialization,
                user: this.doctor.user ? {
                    first_name: this.doctor.user.first_name,
                    last_name: this.doctor.user.last_name
                } : null
            } : null
        };
    }

    /**
     * Check if rating is valid
     * @returns {boolean} Whether the rating is valid
     */
    isRatingValid() {
        return this.rating >= 1 && this.rating <= 5;
    }

    /**
     * Validate required fields
     */
    isValid() {
        return Boolean(
            this.patient_id && 
            this.doctor_id && 
            this.isRatingValid()
        );
    }
}

module.exports = Feedback;