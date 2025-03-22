/**
 * User model representing a user entity
 */
class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.password_hash = data.password_hash;
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
            created_at: this.created_at,
            updated_at: this.updated_at
        };
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
}

module.exports = User;