import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNotifications } from '../contexts/notificationContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import ModernHeader from '../components/ui/ModernHeader';
import { formatDistanceToNow } from '../utils/dateUtils';

/**
 * NotificationsScreen - Shows all app notifications
 */
export default function NotificationsScreen() {
  const { notifications, refreshNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications, loading } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Refresh notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, []);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };
  // Handle notification press
  const handleNotificationPress = async (notificationId: number, notificationData: any) => {
    try {
      // Mark this notification as read
      await markAsRead(notificationId);
      
      // Navigate based on notification type
      if (notificationData?.type === 'appointment_reminder' && notificationData.appointmentId) {
        router.push(`/appointment/${notificationData.appointmentId}`);
      } else if (notificationData?.type === 'appointment' && notificationData.appointmentId) {
        router.push(`/appointment/${notificationData.appointmentId}`);
      } else if (notificationData?.type === 'appointment_cancelled' && notificationData.appointmentId) {
        router.push(`/appointment/${notificationData.appointmentId}`);
      } else if (notificationData?.type === 'appointment_missed' && notificationData.appointmentId) {
        router.push(`/appointment/${notificationData.appointmentId}`);
      } else if (notificationData?.type?.includes('consultation') && notificationData.consultationId) {
        router.push(`/consultation/${notificationData.consultationId}`);
      } else if (notificationData?.type?.includes('consultation_completed') && notificationData.appointmentId) {
        router.push(`/appointment/${notificationData.appointmentId}`);
      } else if (notificationData?.appointmentId) {
        router.push(`/appointment/${notificationData.appointmentId}`);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  // Confirm and clear all notifications
  const confirmClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllNotifications
        }
      ]
    );
  };

  // Delete a specific notification
  const handleDelete = (notificationId: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId)
        }
      ]
    );
  };
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Text style={{color: 'transparent'}}><FontAwesome5 name="calendar-alt" size={24} color={colors.primary} /></Text>;
      case 'consultation':
        return <Text style={{color: 'transparent'}}><FontAwesome5 name="stethoscope" size={24} color={colors.primary} /></Text>;
      case 'cancelled':
        return <Text style={{color: 'transparent'}}><FontAwesome5 name="calendar-times" size={24} color={colors.danger} /></Text>;
      default:
        return <Text style={{color: 'transparent'}}><FontAwesome5 name="bell" size={24} color={colors.primary} /></Text>;
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: colors.card },
        !item.isRead && { borderLeftWidth: 4, borderLeftColor: colors.primary }
      ]}
      onPress={() => handleNotificationPress(item.id, item.data)}
    >      <View style={styles.notificationIcon}>
        <Text style={{ color: 'transparent' }}>
          {getNotificationIcon(item.type)}
        </Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
          {item.body}
        </Text>
        <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
          {formatDistanceToNow(new Date(item.timestamp))}
        </Text>
      </View>      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={{ color: 'transparent' }}>
          <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ModernHeader 
          title="Notifications"
          showBackButton={true}
          showNotification={false}
        />

        {/* Actions Row */}
        <View style={styles.actionsContainer}>          <TouchableOpacity 
            style={styles.actionButton}
            onPress={markAllAsRead}
          >
            <Text style={[styles.actionText, { color: colors.primary }]}>Mark all as read</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={confirmClearAll}
          >
            <Text style={[styles.actionText, { color: colors.danger }]}>Clear all</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (          <View style={styles.emptyContainer}>
            <Text style={{ color: 'transparent' }}>
              <FontAwesome5 name="bell-slash" size={64} color={colors.textTertiary} />
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
              You'll see notifications about appointments, consultations, and system updates here
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListFooterComponent={<View style={{ height: insets.bottom + 20 }} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  listContent: {
    padding: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIcon: {
    marginRight: 16,
    justifyContent: 'flex-start',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
});
