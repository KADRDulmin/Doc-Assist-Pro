import NotificationService from '../services/notificationService';
import { AppointmentData } from '../services/doctorService';

/**
 * Helper functions to manage appointment notifications
 */
const AppointmentNotifications = {
  /**
   * Schedule notifications for an appointment
   * @param appointment The appointment to schedule notifications for
   */
  scheduleAppointmentNotifications: async (appointment: AppointmentData) => {
    try {
      if (!appointment) return;

      const notificationIds = [];
      const appointmentDate = new Date(appointment.appointment_date);
      
      // Parse the appointment time (HH:MM format)
      if (appointment.appointment_time) {
        const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
        appointmentDate.setHours(hours, minutes);
      }
      
      const patientName = appointment.patient?.name || 'a patient';
      
      // Schedule 10 minutes before reminder
      const tenMinNotificationId = await NotificationService.createAppointmentReminder(
        appointment.id,
        patientName,
        appointmentDate,
        10
      );
      if (tenMinNotificationId) {
        notificationIds.push({ time: 10, id: tenMinNotificationId });
      }
      
      // Schedule 1 hour before reminder
      const hourNotificationId = await NotificationService.createAppointmentReminder(
        appointment.id,
        patientName,
        appointmentDate,
        60
      );
      if (hourNotificationId) {
        notificationIds.push({ time: 60, id: hourNotificationId });
      }
      
      // Store notification IDs in AsyncStorage with appointment ID as key
      await NotificationService.addInAppNotification({
        title: 'New Appointment Scheduled',
        body: `You have a new appointment with ${patientName} on ${appointmentDate.toLocaleDateString()} at ${appointment.appointment_time}`,
        data: {
          type: 'appointment',
          appointmentId: appointment.id,
          notificationIds
        },
        type: 'appointment'
      });
      
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling appointment notifications:', error);
    }
  },
  
  /**
   * Cancel all notifications for an appointment
   * @param appointmentId The appointment ID
   * @param notificationIds Optional array of notification IDs
   */
  cancelAppointmentNotifications: async (appointmentId: number, notificationIds?: string[]) => {
    try {
      // If we have the notification IDs directly, cancel them
      if (notificationIds && Array.isArray(notificationIds)) {
        for (const notificationId of notificationIds) {
          await NotificationService.cancelNotification(notificationId);
        }
        return;
      }
      
      // Otherwise try to get notifications from AsyncStorage and find this appointment's notifications
      const notifications = await NotificationService.getInAppNotifications();
      const appointmentNotification = notifications.find(
        notification => notification.data?.appointmentId === appointmentId
      );
      
      if (appointmentNotification?.data?.notificationIds) {
        for (const notificationData of appointmentNotification.data.notificationIds) {
          await NotificationService.cancelNotification(notificationData.id);
        }
      }
    } catch (error) {
      console.error('Error cancelling appointment notifications:', error);
    }
  },
  /**
   * Handle appointment cancellation
   * @param appointment The cancelled appointment
   */
  handleAppointmentCancellation: async (appointment: AppointmentData) => {
    try {
      // Cancel any existing notifications first
      await AppointmentNotifications.cancelAppointmentNotifications(appointment.id);
      
      // Format appointment date for display
      const formattedDate = new Date(appointment.appointment_date).toLocaleDateString();
      const patientName = appointment.patient?.name || 'a patient';
      
      // Add a cancellation notification
      await NotificationService.addInAppNotification({
        title: 'Appointment Cancelled',
        body: `The appointment with ${patientName} on ${formattedDate} has been cancelled.`,
        data: {
          type: 'appointment_cancelled',
          appointmentId: appointment.id
        },
        type: 'cancelled'
      });
      
      // Send an immediate push notification
      await NotificationService.createAppointmentStatusNotification(
        appointment.id, 
        patientName, 
        'cancelled', 
        formattedDate, 
        appointment.appointment_time
      );
      
    } catch (error) {
      console.error('Error handling appointment cancellation:', error);
    }
  },
  /**
   * Notify doctor about consultation completion
   * @param appointment The appointment that was completed
   * @param consultationId The ID of the completed consultation
   */
  notifyConsultationComplete: async (appointment: AppointmentData, consultationId: number) => {
    try {
      const patientName = appointment.patient?.name || 'a patient';
      const formattedDate = new Date(appointment.appointment_date).toLocaleDateString();
      
      // Add an in-app notification
      await NotificationService.addInAppNotification({
        title: 'Consultation Completed',
        body: `You have completed the consultation with ${patientName}. The medical record has been updated.`,
        data: {
          type: 'consultation_completed',
          appointmentId: appointment.id,
          consultationId
        },
        type: 'consultation'
      });
      
      // Send an immediate push notification
      await NotificationService.createAppointmentStatusNotification(
        appointment.id,
        patientName,
        'completed',
        formattedDate,
        appointment.appointment_time
      );
    } catch (error) {
      console.error('Error notifying about consultation completion:', error);
    }
  },
  /**
   * Handle missed appointment notification
   * @param appointment The missed appointment
   */
  handleMissedAppointment: async (appointment: AppointmentData) => {
    try {
      // Cancel any existing notifications first
      await AppointmentNotifications.cancelAppointmentNotifications(appointment.id);
      
      const patientName = appointment.patient?.name || 'a patient';
      const formattedDate = new Date(appointment.appointment_date).toLocaleDateString();
      
      // Add a missed appointment in-app notification
      await NotificationService.addInAppNotification({
        title: 'Appointment Missed',
        body: `The appointment with ${patientName} on ${formattedDate} at ${appointment.appointment_time} was missed.`,
        data: {
          type: 'appointment_missed',
          appointmentId: appointment.id
        },
        type: 'cancelled' // Using cancelled type for styling
      });
      
      // Send an immediate push notification
      await NotificationService.createAppointmentStatusNotification(
        appointment.id,
        patientName,
        'missed',
        formattedDate,
        appointment.appointment_time
      );
      
    } catch (error) {
      console.error('Error handling missed appointment:', error);
    }
  },
};

export default AppointmentNotifications;
