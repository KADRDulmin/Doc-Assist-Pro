/**
 * Appointment Scheduler Service
 * Handles scheduling tasks related to appointments, such as checking for missed appointments
 */

const appointmentRepository = require('../repositories/appointmentRepository');

class AppointmentScheduler {
    constructor() {
        this.missedAppointmentCheckInterval = null;
    }

    /**
     * Start the appointment scheduler
     * @param {Object} options Configuration options
     * @param {number} options.missedAppointmentCheckIntervalMinutes Interval in minutes to check for missed appointments (default: 30)
     */
    start(options = {}) {
        const { missedAppointmentCheckIntervalMinutes = 30 } = options;
        
        // Clear any existing interval
        if (this.missedAppointmentCheckInterval) {
            clearInterval(this.missedAppointmentCheckInterval);
        }
        
        console.log(`Starting appointment scheduler. Checking for missed appointments every ${missedAppointmentCheckIntervalMinutes} minutes.`);
        
        // Convert minutes to milliseconds
        const intervalMs = missedAppointmentCheckIntervalMinutes * 60 * 1000;
        
        // Run immediately on start
        this._checkForMissedAppointments();
        
        // Schedule periodic runs
        this.missedAppointmentCheckInterval = setInterval(() => {
            this._checkForMissedAppointments();
        }, intervalMs);
    }

    /**
     * Stop the appointment scheduler
     */
    stop() {
        if (this.missedAppointmentCheckInterval) {
            clearInterval(this.missedAppointmentCheckInterval);
            this.missedAppointmentCheckInterval = null;
            console.log('Appointment scheduler stopped');
        }
    }

    /**
     * Run the check for missed appointments
     */
    async _checkForMissedAppointments() {
        try {
            console.log('Running scheduled check for missed appointments...');
            const missedAppointments = await appointmentRepository.checkAndMarkMissedAppointments();
            
            if (missedAppointments.length > 0) {
                console.log(`Marked ${missedAppointments.length} appointments as missed`);
                // Here we could add additional actions like sending notifications
            }
        } catch (error) {
            console.error('Error checking for missed appointments:', error);
        }
    }

    /**
     * Run the check for missed appointments immediately (can be called manually or via API)
     */
    async runMissedAppointmentCheck() {
        return this._checkForMissedAppointments();
    }
}

// Create singleton instance
const appointmentScheduler = new AppointmentScheduler();

module.exports = appointmentScheduler;