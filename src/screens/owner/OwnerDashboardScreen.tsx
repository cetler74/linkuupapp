import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ownerAPI } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import { useNotifications } from '../../contexts/NotificationContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../../components/common/Logo';

interface DashboardStats {
  registered_places: number;
  total_bookings: number;
  active_customers: number;
  ongoing_campaigns: number;
  unread_messages: number;
  today_bookings?: number;
  total_revenue?: number;
  new_clients?: number;
}

interface RecentBooking {
  id: number;
  customer_name: string;
  service_name: string;
  booking_date: string;
  booking_time?: string;
  status: string;
  place_name: string;
}

const OwnerDashboardScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = useState<DashboardStats>({
    registered_places: 0,
    total_bookings: 0,
    active_customers: 0,
    ongoing_campaigns: 0,
    unread_messages: 0,
    today_bookings: 0,
    total_revenue: 0,
    new_clients: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const statsData = await ownerAPI.getDashboardStats();
      setStats(statsData);
      
      // Fetch recent bookings
      const bookingsData = await ownerAPI.getRecentBookings(10);
      setRecentBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatDate = (dateString: string | undefined, timeString: string | undefined) => {
    if (!dateString) return '';
    const date = timeString ? new Date(`${dateString}T${timeString}`) : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const quickActions = [
    {
      id: 'new-booking',
      icon: 'plus-circle',
      label: t('dashboard.newBooking') || 'New Booking',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Bookings' as never),
    },
    {
      id: 'manage-services',
      icon: 'content-cut',
      label: t('dashboard.manageServices') || 'Manage Services',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('Places' as never),
    },
    {
      id: 'view-calendar',
      icon: 'calendar-month',
      label: t('dashboard.viewCalendar') || 'View Calendar',
      color: theme.colors.textLight,
      onPress: () => navigation.navigate('Bookings' as never),
    },
    {
      id: 'manage-staff',
      icon: 'account-group',
      label: t('dashboard.manageStaff') || 'Manage Staff',
      color: theme.colors.textLight,
      onPress: () => navigation.navigate('Places' as never),
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('dashboard.title') || 'Dashboard'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => navigation.navigate('Notifications' as never)}
        >
          <View style={styles.notificationIconContainer}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>
          {t('dashboard.welcomeBack', { name: user?.first_name || 'Owner' }) || `Welcome back, ${user?.first_name || 'Owner'}!`}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {t('dashboard.businessSummary') || 'Here is your business summary for today.'}
        </Text>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
      >
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>
            {t('dashboard.todayBookings') || "Today's Bookings"}
          </Text>
          <Text style={styles.statValue}>{stats.today_bookings || stats.total_bookings}</Text>
          <View style={styles.statChange}>
            <MaterialCommunityIcons name="arrow-up" size={16} color="#10b981" />
            <Text style={styles.statChangeText}>+5.2%</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>
            {t('dashboard.totalRevenue') || 'Total Revenue'}
          </Text>
          <Text style={styles.statValue}>
            €{stats.total_revenue?.toFixed(0) || '0'}
          </Text>
          <View style={styles.statChange}>
            <MaterialCommunityIcons name="arrow-up" size={16} color="#10b981" />
            <Text style={styles.statChangeText}>+8.1%</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>
            {t('dashboard.newClients') || 'New Clients'}
          </Text>
          <Text style={styles.statValue}>{stats.new_clients || stats.active_customers}</Text>
          <View style={styles.statChange}>
            <MaterialCommunityIcons name="arrow-down" size={16} color="#ef4444" />
            <Text style={[styles.statChangeText, { color: '#ef4444' }]}>-1.5%</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('dashboard.quickActions') || 'Quick Actions'}
        </Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickActionCard,
                action.color === theme.colors.primary && styles.quickActionPrimary,
                action.color === theme.colors.secondary && styles.quickActionSecondary,
              ]}
              onPress={action.onPress}
            >
              <MaterialCommunityIcons
                name={action.icon as any}
                size={32}
                color={action.color === theme.colors.textLight ? theme.colors.textLight : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.quickActionLabel,
                  action.color !== theme.colors.textLight && styles.quickActionLabelWhite,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.upcomingBookings') || 'Upcoming Bookings'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings' as never)}>
            <Text style={styles.seeAllText}>{t('common.viewAll') || 'View All'}</Text>
          </TouchableOpacity>
        </View>
        {recentBookings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('dashboard.noUpcomingBookings') || 'No upcoming bookings'}
            </Text>
          </Card>
        ) : (
          recentBookings.slice(0, 5).map((booking) => (
            <TouchableOpacity
              key={booking.id}
              onPress={() => navigation.navigate('BookingDetails' as never, { bookingId: booking.id } as never)}
            >
              <Card style={styles.bookingCard}>
                <View style={styles.bookingContent}>
                  <View style={styles.bookingDateBox}>
                    <Text style={styles.bookingMonth}>
                      {new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={styles.bookingDay}>
                      {new Date(booking.booking_date).getDate()}
                    </Text>
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingTime}>
                      {booking.booking_time ? `${formatTime(booking.booking_time)} - ` : ''}{booking.service_name}
                    </Text>
                    <Text style={styles.bookingCustomer}>
                      {t('dashboard.with') || 'with'} {booking.customer_name}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.placeholderLight}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  notificationIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  welcomeSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.sm,
  },
  statsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  statCard: {
    minWidth: 160,
    padding: theme.spacing.md,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statChangeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#10b981',
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  quickActionPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickActionSecondary: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  quickActionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  quickActionLabelWhite: {
    color: '#FFFFFF',
  },
  bookingCard: {
    marginBottom: theme.spacing.sm,
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  bookingDateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 60,
  },
  bookingMonth: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  bookingDay: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTime: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  bookingCustomer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
});

export default OwnerDashboardScreen;
