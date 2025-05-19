import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

class NotificationService {  static async registerForPushNotifications() {
    let token;
    
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    try {
      // Get project ID from environment variable or configuration
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      
      if (!projectId) {
        console.warn('No Expo project ID found. Push notifications will be limited to local notifications only.');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })).data;
      
      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.warn('Error getting push token:', error);
      return null;
    }
  }  static async scheduleLocalNotification(title: string, body: string, date: Date) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: date
      },
    });
  }

  static async scheduleAppointmentReminders(appointmentDate: Date, appointmentTitle: string) {
    const notificationTimes = [
      { minutes: 60, title: '1 Hour Reminder' },
      { minutes: 30, title: '30 Minutes Reminder' },
      { minutes: 10, title: '10 Minutes Reminder' },
    ];

    for (const reminder of notificationTimes) {
      const triggerDate = new Date(appointmentDate);
      triggerDate.setMinutes(triggerDate.getMinutes() - reminder.minutes);

      if (triggerDate > new Date()) {
        await this.scheduleLocalNotification(
          reminder.title,
          `Your appointment "${appointmentTitle}" starts in ${reminder.minutes} minutes.`,
          triggerDate
        );
      }
    }
  }

  static async sendConsultationStartNotification(doctorName: string) {
    return await this.scheduleLocalNotification(
      'Consultation Starting',
      `Your consultation with Dr. ${doctorName} is starting now.`,
      new Date()
    );
  }

  static async sendConsultationEndNotification() {
    return await this.scheduleLocalNotification(
      'Consultation Ended',
      'Your consultation has ended. Don\'t forget to provide feedback!',
      new Date()
    );
  }

  static async sendMissedAppointmentNotification(appointmentTitle: string) {
    return await this.scheduleLocalNotification(
      'Missed Appointment',
      `You missed your appointment: ${appointmentTitle}. Please reschedule if needed.`,
      new Date()
    );
  }

  static async cancelScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default NotificationService;
