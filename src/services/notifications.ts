/**
 * Expo Notifications Service
 * 
 * Handles all push notification functionality for booking alerts and system notifications.
 * 
 * Features:
 * - Request notification permissions
 * - Register device token with backend
 * - Handle incoming notifications (foreground, background, killed)
 * - Schedule local notifications for booking reminders
 * - Handle notification taps and navigation
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/api';
import { storage } from '../utils/storage';
import { navigate } from '../navigation/navigationService';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'new_booking' | 'booking_cancelled' | 'booking_reminder' | 'booking_confirmed' | 'booking_updated' | 'system';
  booking_id?: number;
  place_id?: number;
  title: string;
  body: string;
  [key: string]: any;
}

/**
 * Request notification permissions from the user
 * Required for iOS and Android 13+
 * 
 * Note: Android push notifications require a development build (not Expo Go)
 * in SDK 53+. This function will gracefully handle Expo Go by returning false.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return false;
    }

    // Check if running in Expo Go (which doesn't support Android push notifications in SDK 53+)
    // This is a best-effort check - we'll catch the actual error in getExpoPushToken if needed
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    // Android specific: Request exact alarm permission for scheduled notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('booking-reminders', {
        name: 'Booking Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E90FF',
        sound: 'default',
        description: 'Notifications for upcoming booking reminders',
      });

      await Notifications.setNotificationChannelAsync('booking-updates', {
        name: 'Booking Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E90FF',
        sound: 'default',
        description: 'Notifications for booking status changes',
      });

      await Notifications.setNotificationChannelAsync('new-bookings', {
        name: 'New Bookings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E90FF',
        sound: 'default',
        description: 'Notifications for new booking requests',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the Expo Push Token for this device
 * This token is used to send push notifications to this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get project ID from Expo Constants or environment variable
    // For EAS projects, it's available in Constants.expoConfig.extra.eas.projectId
    // For classic Expo projects, it may be in Constants.expoConfig.extra.projectId
    let projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    
    if (!projectId && Constants.expoConfig?.extra?.eas?.projectId) {
      projectId = Constants.expoConfig.extra.eas.projectId;
    }
    
    if (!projectId && Constants.expoConfig?.extra?.projectId) {
      projectId = Constants.expoConfig.extra.projectId;
    }
    
    // If no project ID is found, skip token generation (it's optional for local development)
    if (!projectId) {
      // Only log in debug mode to reduce noise in development
      if (__DEV__) {
        console.debug('ℹ️ No Expo project ID found. Push notifications disabled in development. Set EXPO_PUBLIC_PROJECT_ID or configure EAS project for production.');
      } else {
        console.warn('No Expo project ID found. Push notifications may not work. Set EXPO_PUBLIC_PROJECT_ID or configure EAS project.');
      }
      return null;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    return tokenData.data;
  } catch (error: any) {
    // Handle Expo Go limitation gracefully
    if (error?.message?.includes('Expo Go') || error?.message?.includes('development build')) {
      if (__DEV__) {
        console.warn('⚠️ Android push notifications require a development build. Use `npm run start` (with dev client) instead of Expo Go. See: https://docs.expo.dev/develop/development-builds/introduction/');
      }
    } else {
      console.error('Error getting Expo push token:', error);
    }
    return null;
  }
}

/**
 * Register device token with backend
 * Backend will use this token to send push notifications
 */
export async function registerDeviceToken(token: string): Promise<boolean> {
  try {
    // Convert deviceType to string (Device.deviceType returns a number enum)
    let deviceTypeStr = 'unknown';
    if (Device.deviceType !== null && Device.deviceType !== undefined) {
      // DeviceType enum: 0=UNKNOWN, 1=PHONE, 2=TABLET, 3=DESKTOP, 4=TV
      const deviceTypeMap: { [key: number]: string } = {
        0: 'unknown',
        1: 'phone',
        2: 'tablet',
        3: 'desktop',
        4: 'tv',
      };
      deviceTypeStr = deviceTypeMap[Device.deviceType] || 'unknown';
    }

    const requestData = {
      device_token: token,
      platform: Platform.OS.toLowerCase(), // Ensure lowercase: 'ios' or 'android'
      device_type: deviceTypeStr,
    };

    if (__DEV__) {
      console.log('📱 Registering device token:', { 
        platform: requestData.platform, 
        device_type: requestData.device_type,
        token_length: token.length 
      });
    }

    const response = await api.post('/notifications/register-device', requestData);
    
    // Store token locally
    await storage.setItem('expo_push_token', token);
    
    if (__DEV__) {
      console.log('✅ Device token registered successfully');
    }
    
    return true;
  } catch (error: any) {
    // Handle 404 gracefully - endpoint may not be implemented yet
    if (error.response?.status === 404) {
      if (__DEV__) {
        console.debug('ℹ️ Device token registration endpoint not found. Push notifications may not work until backend implements /notifications/register-device');
      }
      // Still store token locally in case backend is updated later
      await storage.setItem('expo_push_token', token);
      return false;
    }
    
    // Handle 422 validation errors with detailed logging
    if (error.response?.status === 422) {
      const errorDetail = error.response?.data?.detail || error.response?.data || 'Validation error';
      console.error('❌ Device token registration validation error:', errorDetail);
      if (__DEV__) {
        console.error('Request data that failed:', {
          device_token: token?.substring(0, 20) + '...',
          platform: Platform.OS,
          device_type: Device.deviceType,
        });
      }
      // Still store token locally
      await storage.setItem('expo_push_token', token);
      return false;
    }
    
    // For other errors, log as warning (not error) since this is non-critical
    console.warn('Warning: Failed to register device token:', error.response?.status || error.message);
    if (error.response?.data) {
      console.warn('Error details:', error.response.data);
    }
    return false;
  }
}

/**
 * Unregister device token from backend
 * Call this when user logs out or disables notifications
 */
export async function unregisterDeviceToken(): Promise<boolean> {
  try {
    const token = await storage.getItem('expo_push_token');
    if (token) {
      await api.post('/notifications/unregister-device', {
        device_token: token,
      });
      await storage.removeItem('expo_push_token');
    }
    return true;
  } catch (error: any) {
    // Handle 404 gracefully - endpoint may not be implemented yet
    if (error.response?.status === 404) {
      // Still remove token locally
      await storage.removeItem('expo_push_token');
      return true; // Consider it successful since token is removed locally
    }
    // For other errors, log as warning (not error) since this is non-critical
    console.warn('Warning: Failed to unregister device token:', error.response?.status || error.message);
    // Still try to remove token locally
    await storage.removeItem('expo_push_token');
    return false;
  }
}

/**
 * Schedule a local notification for booking reminder
 * @param bookingId - The booking ID
 * @param bookingDate - The booking date (ISO string)
 * @param bookingTime - The booking time (HH:mm format)
 * @param customerName - Customer name for the notification
 * @param serviceName - Service name for the notification
 * @param reminderMinutes - Minutes before booking to show reminder (default: 60)
 */
export async function scheduleBookingReminder(
  bookingId: number,
  bookingDate: string,
  bookingTime: string,
  customerName: string,
  serviceName: string,
  reminderMinutes: number = 60
): Promise<string | null> {
  try {
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    const reminderTime = new Date(bookingDateTime.getTime() - reminderMinutes * 60 * 1000);
    const now = new Date();

    // Don't schedule if reminder time is in the past
    if (reminderTime <= now) {
      console.warn('Reminder time is in the past, not scheduling');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Booking Reminder',
        body: `${customerName} - ${serviceName} at ${bookingTime}`,
        data: {
          type: 'booking_reminder',
          booking_id: bookingId,
          booking_date: bookingDate,
          booking_time: bookingTime,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: reminderTime,
    });

    // Store notification ID for cancellation if needed
    const scheduledReminders = JSON.parse(await storage.getItem('scheduled_reminders') || '[]');
    scheduledReminders.push({
      notificationId,
      bookingId,
      reminderTime: reminderTime.toISOString(),
    });
    await storage.setItem('scheduled_reminders', JSON.stringify(scheduledReminders));

    return notificationId;
  } catch (error) {
    console.error('Error scheduling booking reminder:', error);
    return null;
  }
}

/**
 * Cancel a scheduled booking reminder
 */
export async function cancelBookingReminder(bookingId: number): Promise<void> {
  try {
    const scheduledReminders = JSON.parse(await storage.getItem('scheduled_reminders') || '[]');
    const reminder = scheduledReminders.find((r: any) => r.bookingId === bookingId);
    
    if (reminder) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      const updated = scheduledReminders.filter((r: any) => r.bookingId !== bookingId);
      await storage.setItem('scheduled_reminders', JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error cancelling booking reminder:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await storage.removeItem('scheduled_reminders');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Handle notification tap - navigate to appropriate screen
 */
export function handleNotificationTap(notification: Notifications.Notification): void {
  const data = notification.request.content.data as NotificationData;
  
  if (data.type === 'new_booking' || data.type === 'booking_updated' || data.type === 'booking_reminder') {
    if (data.booking_id) {
      // Navigate to booking details
      navigate('Bookings', { bookingId: data.booking_id });
    } else {
      // Navigate to bookings list
      navigate('Bookings');
    }
  } else if (data.type === 'booking_cancelled') {
    // Navigate to bookings list
    navigate('Bookings');
  } else if (data.place_id) {
    // Navigate to place details
    navigate('PlaceDetails', { placeId: data.place_id });
  }
}

/**
 * Initialize notification listeners
 * Call this when app starts
 */
export function setupNotificationListeners() {
  // Handle notifications received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received in foreground:', notification);
    // Notification will be shown automatically based on handler configuration
  });

  // Handle notification taps
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    handleNotificationTap(response.notification);
  });

  return {
    foregroundSubscription,
    responseSubscription,
  };
}

/**
 * Remove notification listeners
 * Call this when cleaning up
 */
export function removeNotificationListeners(
  foregroundSubscription: Notifications.Subscription,
  responseSubscription: Notifications.Subscription
): void {
  Notifications.removeNotificationSubscription(foregroundSubscription);
  Notifications.removeNotificationSubscription(responseSubscription);
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

