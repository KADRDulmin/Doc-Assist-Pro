/**
 * Medical Record model 
 */
class MedicalRecord {
    constructor(data) {
        this.id = data.id;
        this.consultation_id = data.consultation_id;
        this.patient_id = data.patient_id;
        this.doctor_id = data.doctor_id;
        this.record_date = data.record_date;
        this.diagnosis = data.diagnosis;
        this.diagnosis_image_url = data.diagnosis_image_url;
        this.treatment_plan = data.treatment_plan;
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
            record_date: this.record_date,
            diagnosis: this.diagnosis,
            diagnosis_image_url: this.diagnosis_image_url,
            treatment_plan: this.treatment_plan,
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
     * Validate required fields
     */
    isValid() {
        return Boolean(
            this.consultation_id && 
            this.patient_id && 
            this.doctor_id && 
            this.record_date &&
            (this.diagnosis || this.diagnosis_image_url) // Require either text diagnosis or image
        );
    }
}

module.exports = MedicalRecord;