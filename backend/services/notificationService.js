const { Expo } = require('expo-server-sdk');
const User = require('../models/user');
const Appointment = require('../models/appointment');
const Consultation = require('../models/consultation');

// Initialize Expo SDK
const expo = new Expo();

class NotificationService {
  // Store appointment reminders to avoid duplicates
  static scheduledReminders = new Map();

  // Send push notification
  static async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`Invalid Expo push token: ${expoPushToken}`);
        return;
      }

      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      };

      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Schedule appointment reminders
  static async scheduleAppointmentReminders(appointment) {
    try {
      const patient = await User.findById(appointment.patient_id);
      if (!patient?.expoPushToken) return;

      const appointmentTime = new Date(appointment.appointment_date);
      appointmentTime.setHours(
        parseInt(appointment.appointment_time.split(':')[0]),
        parseInt(appointment.appointment_time.split(':')[1])
      );

      const reminders = [
        { minutes: 60, message: '1 hour' },
        { minutes: 30, message: '30 minutes' },
        { minutes: 10, message: '10 minutes' }
      ];

      reminders.forEach(reminder => {
        const reminderTime = new Date(appointmentTime.getTime() - reminder.minutes * 60000);
        const now = new Date();

        if (reminderTime > now) {
          const timeout = reminderTime.getTime() - now.getTime();
          const reminderId = `${appointment._id}-${reminder.minutes}`;

          // Clear existing reminder if any
          if (this.scheduledReminders.has(reminderId)) {
            clearTimeout(this.scheduledReminders.get(reminderId));
          }

          // Schedule new reminder
          const timerId = setTimeout(async () => {
            await this.sendPushNotification(
              patient.expoPushToken,
              'Upcoming Appointment Reminder',
              `Your appointment is in ${reminder.message}`,
              {
                type: 'appointment_reminder',
                appointmentId: appointment._id.toString()
              }
            );
            this.scheduledReminders.delete(reminderId);
          }, timeout);

          this.scheduledReminders.set(reminderId, timerId);
        }
      });
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
    }
  }

  // Send consultation started notification
  static async sendConsultationStartedNotification(consultation) {
    try {
      const patient = await User.findById(consultation.patient_id);
      if (!patient?.expoPushToken) return;

      await this.sendPushNotification(
        patient.expoPushToken,
        'Consultation Started',
        'Your consultation has started',
        {
          type: 'consultation_started',
          consultationId: consultation._id.toString()
        }
      );
    } catch (error) {
      console.error('Error sending consultation started notification:', error);
    }
  }

  // Send consultation ended notification
  static async sendConsultationEndedNotification(consultation) {
    try {
      const patient = await User.findById(consultation.patient_id);
      if (!patient?.expoPushToken) return;

      await this.sendPushNotification(
        patient.expoPushToken,
        'Consultation Ended',
        'Your consultation has ended',
        {
          type: 'consultation_ended',
          consultationId: consultation._id.toString()
        }
      );
    } catch (error) {
      console.error('Error sending consultation ended notification:', error);
    }
  }

  // Send missed appointment notification
  static async sendMissedAppointmentNotification(appointment) {
    try {
      const patient = await User.findById(appointment.patient_id);
      if (!patient?.expoPushToken) return;

      await this.sendPushNotification(
        patient.expoPushToken,
        'Missed Appointment',
        'You have missed your scheduled appointment',
        {
          type: 'appointment_missed',
          appointmentId: appointment._id.toString()
        }
      );
    } catch (error) {
      console.error('Error sending missed appointment notification:', error);
    }
  }

  // Cancel scheduled reminders for an appointment
  static cancelAppointmentReminders(appointmentId) {
    for (const [reminderId, timerId] of this.scheduledReminders.entries()) {
      if (reminderId.startsWith(appointmentId)) {
        clearTimeout(timerId);
        this.scheduledReminders.delete(reminderId);
      }
    }
  }
}

module.exports = NotificationService;