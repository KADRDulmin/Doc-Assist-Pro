import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api, { ApiResponse } from './api';

// Storage key for push token
const PUSH_TOKEN_KEY = 'doctor_push_token';

// Type definitions
export interface NotificationData {
  id: number;
  title: string;
  body: string;
  data: any;
  timestamp: string; // ISO string
  isRead: boolean;
  type: 'appointment' | 'consultation' | 'system' | 'cancelled';
}

/**
 * Doctor Portal Notification Service
 * Handles push notifications and in-app notifications for doctors
 */
class NotificationService {
  /**
   * Configure the notification handler for the app
   */
  static configureNotifications() {
    // Set how notifications should be handled when app is foregrounded
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
  /**
   * Register for local notifications
   * @returns A mock token for compatibility with existing code
   */
  static async registerForPushNotifications(): Promise<string | undefined> {
    try {
      // Request permissions for local notifications
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Failed to get notification permissions');
        return undefined;
      }
      
      // Configure for Android
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0466C8',
          });
        } catch (channelError) {
          console.log('Error setting up notification channel', channelError);
        }
      }
      
      // Return a mock token - we're not actually registering for push notifications
      // but this keeps the existing code working
      console.log('Using notification system (local only)');
      return 'local-notifications-only';
      
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return undefined;
    }
  }
  /**
   * Register the doctor's push token with the backend
   * (Simplified version - no server integration)
   */
  static async registerPushTokenWithServer(token: string, authToken: string): Promise<boolean> {
    // This is a dummy implementation that always succeeds
    // No server call is made
    console.log('Push token registration simplified - no server call made');
    return true;
  }
  /**
   * Schedule a local notification
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: any = null,
    data: any = {}
  ): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Send immediate notification
   */
  static async sendImmediateNotification(title: string, body: string, data: any = {}): Promise<string> {
    return this.scheduleLocalNotification(title, body, null, data);
  }

  /**
   * Create appointment reminder notification
   */  static async createAppointmentReminder(
    appointmentId: number,
    patientName: string,
    appointmentTime: Date,
    minutesBefore: number
  ): Promise<string> {
    const reminderTime = new Date(appointmentTime.getTime() - minutesBefore * 60 * 1000);
    
    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      return '';
    }

    return this.scheduleLocalNotification(
      'Upcoming Appointment',
      `You have an appointment with ${patientName} in ${minutesBefore} minutes`,
      {
        type: 'date',
        date: reminderTime,
      },
      {
        type: 'appointment_reminder',
        appointmentId,
      }
    );
  }

  /**
   * Create appointment status notification
   */
  static async createAppointmentStatusNotification(
    appointmentId: number,
    patientName: string,
    status: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<string> {
    let title = '';
    let body = '';
    
    switch (status) {
      case 'cancelled':
        title = 'Appointment Cancelled';
        body = `The appointment with ${patientName} on ${appointmentDate} at ${appointmentTime} has been cancelled.`;
        break;
      case 'completed':
        title = 'Appointment Completed';
        body = `The appointment with ${patientName} has been marked as completed.`;
        break;
      case 'missed':
        title = 'Appointment Missed';
        body = `The appointment with ${patientName} on ${appointmentDate} at ${appointmentTime} was missed.`;
        break;
      default:
        title = 'Appointment Update';
        body = `The status of your appointment with ${patientName} has been updated to ${status}.`;
    }

    return this.sendImmediateNotification(
      title,
      body,
      {
        type: `appointment_${status}`,
        appointmentId,
        status
      }
    );
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Cancel a specific notification by ID
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Get all in-app notifications from storage
   */
  static async getInAppNotifications(): Promise<NotificationData[]> {
    try {
      const notificationsJson = await AsyncStorage.getItem('in_app_notifications');
      if (notificationsJson) {
        return JSON.parse(notificationsJson) as NotificationData[];
      }
      return [];
    } catch (error) {
      console.error('Error getting in-app notifications:', error);
      return [];
    }
  }

  /**
   * Save in-app notifications to storage
   */
  static async saveInAppNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      await AsyncStorage.setItem('in_app_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving in-app notifications:', error);
    }
  }

  /**
   * Add a new in-app notification
   */
  static async addInAppNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
    const notifications = await this.getInAppNotifications();
    
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    notifications.unshift(newNotification);
    await this.saveInAppNotifications(notifications);
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationAsRead(notificationId: number): Promise<void> {
    const notifications = await this.getInAppNotifications();
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true } 
        : notification
    );
    
    await this.saveInAppNotifications(updatedNotifications);
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(): Promise<void> {
    const notifications = await this.getInAppNotifications();
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, 
      isRead: true 
    }));
    
    await this.saveInAppNotifications(updatedNotifications);
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: number): Promise<void> {
    const notifications = await this.getInAppNotifications();
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    await this.saveInAppNotifications(updatedNotifications);
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    await this.saveInAppNotifications([]);
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    const notifications = await this.getInAppNotifications();
    return notifications.filter(notification => !notification.isRead).length;
  }

  /**
   * Create a test notification (for development testing)
   */
  static async createTestNotification(type: string = 'system'): Promise<string> {
    const timestamp = new Date().toLocaleTimeString();
    let title = 'Test Notification';
    let body = `This is a test notification created at ${timestamp}`;
    let data: any = { type: 'test' };
    
    // Create specific test notifications based on type
    switch (type) {
      case 'appointment':
        title = 'Test: New Appointment';
        body = `Test: You have a new appointment with John Doe tomorrow at 10:00 AM`;
        data = {
          type: 'appointment',
          appointmentId: 999, // Test ID
          date: '2023-05-22',
          time: '10:00'
        };
        break;
      
      case 'reminder':
        title = 'Test: Appointment Reminder';
        body = `Test: You have an appointment with Jane Smith in 10 minutes`;
        data = {
          type: 'appointment_reminder',
          appointmentId: 999, // Test ID
        };
        break;
      
      case 'cancelled':
        title = 'Test: Appointment Cancelled';
        body = `Test: The appointment with John Doe on 22 May at 10:00 AM has been cancelled`;
        data = {
          type: 'appointment_cancelled',
          appointmentId: 999, // Test ID
        };
        break;
        
      case 'completed':
        title = 'Test: Consultation Completed';
        body = `Test: You have completed the consultation with Jane Smith`;
        data = {
          type: 'consultation_completed',
          appointmentId: 999, // Test ID
          consultationId: 888, // Test ID
        };
        break;
    }
    
    // Add to in-app notifications
    await this.addInAppNotification({
      title,
      body,
      data,
      type: type === 'cancelled' ? 'cancelled' : type === 'completed' ? 'consultation' : 'appointment'
    });
    
    // Send as push notification too
    return this.sendImmediateNotification(title, body, data);
  }
}

export default NotificationService;
