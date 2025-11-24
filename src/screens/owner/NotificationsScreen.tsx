import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI } from '../../api/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  booking_id: number | null;
  place_id: number | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { markAsRead, markAllAsRead, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await ownerAPI.getNotifications(50, 0, activeTab === 'unread');
      setNotifications(Array.isArray(response) ? response : []);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    Alert.alert(
      t('notifications.delete') || 'Delete Notification',
      t('notifications.confirmDelete') || 'Are you sure you want to delete this notification?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerAPI.deleteNotification(notificationId);
              await fetchNotifications();
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert(t('common.error') || 'Error', t('notifications.deleteError') || 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.booking_id) {
      navigation.navigate('Bookings' as never, { bookingId: notification.booking_id } as never);
    } else if (notification.place_id) {
      navigation.navigate('PlaceDetails' as never, { placeId: notification.place_id } as never);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_booking':
        return 'calendar-plus';
      case 'booking_cancelled':
        return 'calendar-remove';
      case 'booking_confirmed':
        return 'calendar-check';
      case 'booking_reminder':
        return 'bell-ring';
      case 'booking_updated':
        return 'calendar-edit';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_booking':
        return theme.colors.primary;
      case 'booking_cancelled':
        return theme.colors.secondary;
      case 'booking_confirmed':
        return '#10b981';
      case 'booking_reminder':
        return '#f59e0b';
      case 'booking_updated':
        return theme.colors.primary;
      default:
        return theme.colors.placeholderLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('notifications.minutesAgo') || 'minutes ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('notifications.hoursAgo') || 'hours ago'}`;
    if (diffDays < 7) return `${diffDays} ${t('notifications.daysAgo') || 'days ago'}`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('notifications.title') || 'Notifications'}
        </Text>
        {notifications.filter(n => !n.is_read).length > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>
              {t('notifications.markAllRead') || 'Mark all read'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            {t('notifications.all') || 'All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
            {t('notifications.unread') || 'Unread'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyTitle}>
            {t('notifications.noNotifications') || 'No Notifications'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'unread'
              ? t('notifications.noUnreadNotifications') || 'No unread notifications'
              : t('notifications.noNotificationsDesc') || 'You\'re all caught up!'}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.notificationsList}
          contentContainerStyle={styles.notificationsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {notifications.map((notification) => {
            const iconColor = getNotificationColor(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <Card style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}>
                  <View style={styles.notificationContent}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                      <MaterialCommunityIcons
                        name={getNotificationIcon(notification.type) as any}
                        size={24}
                        color={iconColor}
                      />
                    </View>
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {!notification.is_read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatDate(notification.created_at)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(notification.id)}
                      style={styles.deleteButton}
                    >
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={20}
                        color={theme.colors.placeholderLight}
                      />
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  markAllButton: {
    padding: theme.spacing.xs,
  },
  markAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.placeholderLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsListContent: {
    padding: theme.spacing.md,
  },
  notificationCard: {
    marginBottom: theme.spacing.md,
  },
  unreadCard: {
    backgroundColor: `${theme.colors.primary}05`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  notificationTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  notificationMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
});

export default NotificationsScreen;

