/**
 * User model representing a user entity
 */
class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.password_hash = data.password_hash;
        
        // Handle different column naming conventions
        this.first_name = data.first_name || data.firstname || '';
        this.last_name = data.last_name || data.lastname || '';
        
        this.role = data.role || 'patient';
        this.phone = data.phone || '';
        this.is_active = data.is_active !== false;
        this.is_verified = Boolean(data.is_verified);
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Convert user object to JSON safe version (without password)
     */
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            first_name: this.first_name,
            last_name: this.last_name,
            role: this.role,
            phone: this.phone,
            is_active: this.is_active,
            is_verified: this.is_verified,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    /**
     * Get user's full name
     */
    getFullName() {
        return `${this.first_name || ''} ${this.last_name || ''}`.trim() || 'Unnamed User';
    }

    /**
     * Check if user has specific role
     */
    hasRole(role) {
        return this.role === role;
    }

    /**
     * Check if user is a doctor
     */
    isDoctor() {
        return this.role === 'doctor';
    }

    /**
     * Check if user is a patient
     */
    isPatient() {
        return this.role === 'patient';
    }

    /**
     * Check if user is an admin
     */
    isAdmin() {
        return this.role === 'admin';
    }

    /**
     * Validate user data
     */
    isValid() {
        return this.email && this.password_hash;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether email is valid
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} - Validation result with status and message
     */
    static validatePassword(password) {
        if (!password || password.length < 6) {
            return { 
                valid: false, 
                message: 'Password must be at least 6 characters long' 
            };
        }
        
        return { valid: true };
    }

    /**
     * Get valid user roles
     */
    static getRoles() {
        return ['admin', 'doctor', 'patient'];
    }

    /**
     * Check if a role is valid
     */
    static isValidRole(role) {
        return User.getRoles().includes(role);
    }
}

module.exports = User;