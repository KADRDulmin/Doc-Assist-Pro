/**
 * Prescription model 
 */
class Prescription {
    constructor(data) {
        this.id = data.id;
        this.consultation_id = data.consultation_id;
        this.patient_id = data.patient_id;
        this.doctor_id = data.doctor_id;
        this.prescription_date = data.prescription_date;
        this.prescription_text = data.prescription_text;
        this.prescription_image_url = data.prescription_image_url;
        this.status = data.status || 'active'; // active, completed, cancelled
        this.duration_days = data.duration_days;
        this.notes = data.notes;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
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
            consultation_id: this.consultation_id,
            patient_id: this.patient_id,
            doctor_id: this.doctor_id,
            prescription_date: this.prescription_date,
            prescription_text: this.prescription_text,
            prescription_image_url: this.prescription_image_url,
            status: this.status,
            duration_days: this.duration_days,
            notes: this.notes,
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
     * Get valid prescription statuses
     * @returns {string[]} List of valid prescription statuses
     */
    static getValidStatuses() {
        return ['active', 'completed', 'cancelled'];
    }

    /**
     * Validate required fields
     */
    isValid() {
        return Boolean(
            this.consultation_id && 
            this.patient_id && 
            this.doctor_id && 
            this.prescription_date &&
            (this.prescription_text || this.prescription_image_url) && // Require either text prescription or image
            Prescription.getValidStatuses().includes(this.status)
        );
    }
}

module.exports = Prescription;