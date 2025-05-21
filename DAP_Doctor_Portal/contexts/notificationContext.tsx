import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import NotificationService, { NotificationData } from '../services/notificationService';
import { useAuth } from './AuthContext';

// Define context type
interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  loading: boolean;
}

// Create the context with a default value
export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAllNotifications: async () => {},
  loading: false,
});

// Hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);

// Props for the provider
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationListener, setNotificationListener] = useState<Subscription | null>(null);
  const [responseListener, setResponseListener] = useState<Subscription | null>(null);
  
  const { user, token } = useAuth();
  const router = useRouter();

  // Configure notifications on mount
  useEffect(() => {
    NotificationService.configureNotifications();
    
    // Load existing notifications
    refreshNotifications();

    // Set up notification listeners
    setupNotificationListeners();

    // Register for push notifications if user is logged in
    if (user && token) {
      registerForPushNotifications();
    }

    // Clean up listeners on unmount
    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [user, token]);
  // Set up local notifications only (no push notifications)
  const registerForPushNotifications = async () => {
    try {
      // This only sets up local notifications now
      await NotificationService.registerForPushNotifications();
      // No server registration needed
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  // Set up notification listeners
  const setupNotificationListeners = () => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      
      // Add the notification to in-app notifications
      handleNewNotification(title || 'New Notification', body || '', data);
    });
    
    setNotificationListener(notificationSubscription);

    // This listener is fired whenever a user taps on or interacts with a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      handleNotificationResponse(data);
    });
    
    setResponseListener(responseSubscription);
  };

  // Handle a new incoming notification
  const handleNewNotification = async (title: string, body: string, data: any) => {
    try {
      // Determine notification type
      let notificationType: 'appointment' | 'consultation' | 'system' | 'cancelled' = 'system';
      
      if (data?.type) {
        if (data.type.includes('appointment')) {
          notificationType = data.type.includes('cancelled') ? 'cancelled' : 'appointment';
        } else if (data.type.includes('consultation')) {
          notificationType = 'consultation';
        }
      }

      // Add to in-app notifications
      await NotificationService.addInAppNotification({
        title,
        body,
        data,
        type: notificationType,
      });

      // Refresh notifications to update UI
      await refreshNotifications();
    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  };
  // Handle when user taps on a notification
  const handleNotificationResponse = (data: any) => {
    try {
      // Navigate based on notification type
      if (data?.type === 'appointment_reminder' && data.appointmentId) {
        // Navigate to specific appointment view
        router.push(`/appointment/${data.appointmentId}`);
      } else if (data?.type === 'appointment' && data.appointmentId) {
        // Show appointment details when user taps on a new appointment notification
        router.push(`/appointment/${data.appointmentId}`);
      } else if (data?.type === 'appointment_cancelled' && data.appointmentId) {
        // Show cancelled appointment details
        router.push(`/appointment/${data.appointmentId}`);
      } else if (data?.type?.includes('consultation') && data.consultationId) {
        // Show consultation screen
        router.push(`/consultation/${data.consultationId}`);
      } else if (data?.type?.includes('consultation_completed') && data.appointmentId) {
        // If consultation ID not available, navigate to appointment
        router.push(`/appointment/${data.appointmentId}`);
      } else {
        // Default to notifications screen
        router.push('/notifications');
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  };

  // Refresh notifications from storage
  const refreshNotifications = async () => {
    try {
      setLoading(true);
      const storedNotifications = await NotificationService.getInAppNotifications();
      setNotifications(storedNotifications);
      
      // Update unread count
      const unread = storedNotifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await NotificationService.markNotificationAsRead(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllNotificationsAsRead();
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: number) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await NotificationService.clearAllNotifications();
      await refreshNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Create context value object
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loading,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
