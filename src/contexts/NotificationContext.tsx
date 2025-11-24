/**
 * Notification Context
 * 
 * Provides notification state and functions throughout the app.
 * Handles:
 * - Notification permissions
 * - Device token registration
 * - Unread notification count
 * - Notification preferences
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  getExpoPushToken,
  registerDeviceToken,
  unregisterDeviceToken,
  setupNotificationListeners,
  removeNotificationListeners,
  getBadgeCount,
  setBadgeCount,
  type NotificationData,
} from '../services/notifications';
import { ownerAPI } from '../api/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  hasPermission: boolean;
  isLoading: boolean;
  unreadCount: number;
  requestPermission: () => Promise<boolean>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isBusinessOwner, user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [listeners, setListeners] = useState<{
    foregroundSubscription: Notifications.Subscription;
    responseSubscription: Notifications.Subscription;
  } | null>(null);

  // Initialize notifications
  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    } else {
      cleanupNotifications();
    }

    return () => {
      cleanupNotifications();
    };
  }, [isAuthenticated]);

  // Refresh unread count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, isBusinessOwner]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && isAuthenticated && isBusinessOwner) {
      refreshUnreadCount();
    }
  }, [isAuthenticated, isBusinessOwner]);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);

      // Request permissions
      const permissionGranted = await requestNotificationPermissions();
      setHasPermission(permissionGranted);

      if (permissionGranted) {
        // Get and register device token
        const token = await getExpoPushToken();
        if (token) {
          await registerDeviceToken(token);
        }

        // Setup notification listeners
        const notificationListeners = setupNotificationListeners();
        setListeners(notificationListeners);

        // Set initial badge count
        if (isBusinessOwner) {
          await refreshUnreadCount();
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupNotifications = async () => {
    if (listeners) {
      removeNotificationListeners(listeners.foregroundSubscription, listeners.responseSubscription);
      setListeners(null);
    }
    await unregisterDeviceToken();
    await setBadgeCount(0);
  };

  const requestPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    
    if (granted) {
      const token = await getExpoPushToken();
      if (token) {
        await registerDeviceToken(token);
      }
    }
    
    return granted;
  };

  const refreshUnreadCount = async () => {
    if (!isAuthenticated || !isBusinessOwner) {
      setUnreadCount(0);
      await setBadgeCount(0);
      return;
    }

    try {
      const response = await ownerAPI.getUnreadNotificationCount();
      const count = response.count || 0;
      setUnreadCount(count);
      await setBadgeCount(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await ownerAPI.markNotificationAsRead(notificationId);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await ownerAPI.markAllNotificationsAsRead();
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Refresh unread count periodically
  useEffect(() => {
    if (isAuthenticated && isBusinessOwner) {
      refreshUnreadCount();
      const interval = setInterval(refreshUnreadCount, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isBusinessOwner]);

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        isLoading,
        unreadCount,
        requestPermission,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

