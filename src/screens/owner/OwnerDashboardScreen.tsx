import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ownerAPI } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import { useNotifications } from '../../contexts/NotificationContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

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

interface QuickAction {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
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

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const handleManageServices = async () => {
    try {
      const places = await ownerAPI.getOwnerPlaces();
      if (places.length > 0) {
        navigation.navigate('ServicesManagement' as never, { placeId: places[0].id } as never);
      } else {
        navigation.navigate('Places' as never);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      navigation.navigate('Places' as never);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-booking',
      icon: 'calendar-plus',
      label: t('dashboard.newBooking') || 'New Booking',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Bookings' as never),
    },
    {
      id: 'manage-services',
      icon: 'content-cut',
      label: t('dashboard.manageServices') || 'Services',
      color: theme.colors.secondary, // Teal
      onPress: handleManageServices,
    },
    {
      id: 'view-calendar',
      icon: 'calendar-month',
      label: t('dashboard.viewCalendar') || 'Calendar',
      color: theme.colors.warning, // Amber/Orange
      onPress: () => navigation.navigate('Bookings' as never),
    },
    {
      id: 'manage-staff',
      icon: 'account-group',
      label: t('dashboard.manageStaff') || 'Staff',
      color: '#E91E63', // Pink
      onPress: () => navigation.navigate('Staff' as never),
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Content */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerBranding}>
              <Logo width={32} height={32} color="#FFFFFF" animated={false} />
              <Text style={styles.headerTitle}>Linkuup</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              {t('dashboard.welcomeBack', { name: user?.name || 'Owner' }) || `Hello, ${user?.name || 'Owner'}!`}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Stats Cards - Floating Overlap */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
          style={styles.statsContainer}
        >
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${theme.colors.success}15` }]}>
              <MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.statLabel}>
              {t('dashboard.todayBookings') || "Today's Bookings"}
            </Text>
            <Text style={styles.statValue}>{stats.today_bookings || stats.total_bookings}</Text>
            <View style={styles.statFooter}>
              <Text style={[styles.statTrend, { color: theme.colors.success }]}>
                <MaterialCommunityIcons name="arrow-up" size={14} /> 5.2%
              </Text>
              <Text style={styles.statPeriod}>vs last week</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${theme.colors.info}15` }]}>
              <MaterialCommunityIcons name="currency-eur" size={24} color={theme.colors.info} />
            </View>
            <Text style={styles.statLabel}>
              {t('dashboard.totalRevenue') || 'Total Revenue'}
            </Text>
            <Text style={styles.statValue}>
              €{stats.total_revenue?.toFixed(0) || '0'}
            </Text>
            <View style={styles.statFooter}>
              <Text style={[styles.statTrend, { color: theme.colors.info }]}>
                <MaterialCommunityIcons name="arrow-up" size={14} /> 8.1%
              </Text>
              <Text style={styles.statPeriod}>vs last month</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${theme.colors.error}15` }]}>
              <MaterialCommunityIcons name="account-multiple" size={24} color={theme.colors.error} />
            </View>
            <Text style={styles.statLabel}>
              {t('dashboard.newClients') || 'New Clients'}
            </Text>
            <Text style={styles.statValue}>{stats.new_clients || stats.active_customers}</Text>
            <View style={styles.statFooter}>
              <Text style={[styles.statTrend, { color: theme.colors.error }]}>
                <MaterialCommunityIcons name="arrow-down" size={14} /> 1.5%
              </Text>
              <Text style={styles.statPeriod}>vs last week</Text>
            </View>
          </View>
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
                style={styles.quickActionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
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
              <MaterialCommunityIcons name="calendar-blank" size={48} color={theme.colors.placeholderLight} />
              <Text style={styles.emptyText}>
                {t('dashboard.noUpcomingBookings') || 'No upcoming bookings'}
              </Text>
            </Card>
          ) : (
            <View style={styles.bookingsList}>
              {recentBookings.slice(0, 5).map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingItem}
                  onPress={() => navigation.navigate('BookingDetails' as never, { bookingId: booking.id } as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bookingDateBox}>
                    <Text style={styles.bookingDay}>
                      {new Date(booking.booking_date).getDate()}
                    </Text>
                    <Text style={styles.bookingMonth}>
                      {new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </View>

                  <View style={styles.bookingContent}>
                    <Text style={styles.bookingService} numberOfLines={1}>
                      {booking.service_name}
                    </Text>
                    <Text style={styles.bookingCustomer} numberOfLines={1}>
                      {booking.customer_name}
                    </Text>
                    <View style={styles.bookingMeta}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.placeholderLight} />
                      <Text style={styles.bookingTime}>
                        {booking.booking_time ? formatTime(booking.booking_time) : 'TBD'}
                      </Text>
                      <View style={styles.dotSeparator} />
                      <Text style={[
                        styles.bookingStatus,
                        { color: booking.status === 'confirmed' ? theme.colors.success : theme.colors.placeholderLight }
                      ]}>
                        {booking.status}
                      </Text>
                    </View>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={theme.colors.placeholderLight}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: theme.colors.backgroundLight,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: theme.colors.primary,
    zIndex: 0,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: width / 2,
    borderBottomRightRadius: width / 2,
    transform: [{ scaleX: 1.5 }],
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  headerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  welcomeContainer: {
    marginTop: theme.spacing.xs,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsContainer: {
    marginTop: -theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  statsScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    width: 160,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.placeholderLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTrend: {
    fontSize: 12,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statPeriod: {
    fontSize: 10,
    color: theme.colors.placeholderLight,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  bookingsList: {
    gap: theme.spacing.sm,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  bookingDateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    width: 50,
    height: 50,
    marginRight: theme.spacing.md,
  },
  bookingDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  bookingMonth: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.placeholderLight,
    textTransform: 'uppercase',
  },
  bookingContent: {
    flex: 1,
    gap: 4,
  },
  bookingService: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  bookingCustomer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingTime: {
    fontSize: 12,
    color: theme.colors.placeholderLight,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.placeholderLight,
  },
  bookingStatus: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
});

export default OwnerDashboardScreen;
