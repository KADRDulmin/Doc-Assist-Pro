/**
 * Patient Profile model
 */
class PatientProfile {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.date_of_birth = data.date_of_birth;
        this.gender = data.gender || '';
        this.blood_group = data.blood_group || '';
        this.allergies = data.allergies || '';
        this.medical_history = data.medical_history || '';
        this.emergency_contact_name = data.emergency_contact_name || '';
        this.emergency_contact_phone = data.emergency_contact_phone || '';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // User data if joined
        this.user = data.user || null;
    }

    /**
     * Convert to JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            date_of_birth: this.date_of_birth,
            gender: this.gender,
            blood_group: this.blood_group,
            allergies: this.allergies,
            medical_history: this.medical_history,
            emergency_contact_name: this.emergency_contact_name,
            emergency_contact_phone: this.emergency_contact_phone,
            created_at: this.created_at,
            updated_at: this.updated_at,
            // Include user data if available
            user: this.user ? {
                id: this.user.id,
                email: this.user.email,
                first_name: this.user.first_name,
                last_name: this.user.last_name,
                phone: this.user.phone
            } : null
        };
    }

    /**
     * Calculate age based on date of birth
     */
    getAge() {
        if (!this.date_of_birth) return null;
        
        const dob = new Date(this.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        
        // Adjust if birthday hasn't occurred yet this year
        if (
            today.getMonth() < dob.getMonth() || 
            (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
        ) {
            age--;
        }
        
        return age;
    }

    /**
     * Valid blood groups
     */
    static getBloodGroups() {
        return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    }

    /**
     * Valid genders
     */
    static getGenders() {
        return ['Male', 'Female', 'Other', 'Prefer not to say'];
    }
}

module.exports = PatientProfile;
