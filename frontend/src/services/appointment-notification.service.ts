import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import NotificationService from './notification.service';
import { AppointmentData } from './appointment.service';

// Set up default behavior for all notifications in the app
export const configureNotifications = () => {
  // Enable in-app notification banners
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Set up notification tap handler
  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.screen && data?.id) {
      router.push({ pathname: data.screen, params: { id: data.id }});
    }
  });
};

export const AppointmentNotificationManager = {
  /**
   * Schedule notifications for a new appointment
   */
  async scheduleAppointmentNotifications(appointment: AppointmentData): Promise<void> {
    try {
      const appointmentDate = new Date(`${appointment.appointment_date} ${appointment.appointment_time}`);
      const doctorName = appointment.doctor?.user ? 
        `Dr. ${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}` : 
        'your doctor';

      // Schedule reminders
      await NotificationService.scheduleAppointmentReminders(
        appointmentDate,
        `Appointment with ${doctorName}`
      );
      
      // Schedule consultation start notification
      await NotificationService.scheduleLocalNotification(
        'Consultation Starting',
        `Your consultation with ${doctorName} is starting now.`,
        appointmentDate
      );
      
      // Schedule consultation end notification (assuming 30-minute consultations)
      const consultationEndDate = new Date(appointmentDate);
      consultationEndDate.setMinutes(consultationEndDate.getMinutes() + 30);
      await NotificationService.scheduleLocalNotification(
        'Consultation Ended',
        'Your consultation has ended. Please provide your feedback.',
        consultationEndDate
      );

    } catch (error) {
      console.error('Failed to schedule appointment notifications:', error);
    }
  },

  /**
   * Cancel all notifications for an appointment
   */
  async cancelAppointmentNotifications(): Promise<void> {
    try {
      await NotificationService.cancelScheduledNotifications();
    } catch (error) {
      console.error('Failed to cancel appointment notifications:', error);
    }
  },

  /**
   * Send a notification for a missed appointment
   */
  async sendMissedAppointmentNotification(appointment: AppointmentData): Promise<void> {
    try {
      const doctorName = appointment.doctor?.user ? 
        `Dr. ${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}` : 
        'your doctor';

      await NotificationService.sendMissedAppointmentNotification(
        `Appointment with ${doctorName}`
      );
    } catch (error) {
      console.error('Failed to send missed appointment notification:', error);
    }
  }
};
