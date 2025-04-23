/**
 * Doctor Profile model
 */
class DoctorProfile {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.specialization = data.specialization || '';
        this.license_number = data.license_number || '';
        this.years_of_experience = data.years_of_experience || 0;
        this.education = data.education || '';
        this.bio = data.bio || '';
        this.consultation_fee = data.consultation_fee || 0;
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
            specialization: this.specialization,
            license_number: this.license_number,
            years_of_experience: this.years_of_experience,
            education: this.education,
            bio: this.bio,
            consultation_fee: this.consultation_fee,
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
     * Validate required fields
     */
    isValid() {
        return Boolean(this.user_id && this.specialization && this.license_number);
    }

    /**
     * Get valid specializations
     * @returns {string[]} List of valid specializations
     */
    static getSpecializations() {
        // Added this console.log to help with debugging
        console.log('Getting doctor specializations list');
        return [
            'Cardiology',
            'Dermatology',
            'Endocrinology',
            'Gastroenterology',
            'Neurology',
            'Oncology',
            'Pediatrics',
            'Psychiatry',
            'Radiology',
            'Surgery',
            'Urology',
            'General Medicine',
            'Orthopedics',
            'Gynecology',
            'Ophthalmology',
            'ENT',
            'Dental'
        ];
    }
}

module.exports = DoctorProfile;
