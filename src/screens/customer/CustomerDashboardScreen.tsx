import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI } from '../../api/api';
import { theme } from '../../theme/theme';
import SearchBar from '../../components/common/SearchBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Booking {
  id: number;
  date: string;
  time: string;
  service_name: string;
  place_name: string;
  place_image?: string;
  status: string;
}

const CustomerDashboardScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [rewardsPoints, setRewardsPoints] = useState(1250);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  const fetchUpcomingBookings = async () => {
    try {
      setIsLoading(true);
      // Fetch upcoming bookings from API
      const response = await bookingAPI.getBookings({ status: 'upcoming' });
      const bookings = Array.isArray(response) ? response : response.bookings || [];
      setUpcomingBookings(bookings.slice(0, 3)); // Show only first 3
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setUpcomingBookings([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUpcomingBookings();
  };

  const serviceCategories = [
    { icon: '💇', name: t('home.beauty') || 'Beauty', id: 'beauty' },
    { icon: '💆', name: t('home.wellness') || 'Wellness', id: 'wellness' },
    { icon: '💪', name: t('home.fitness') || 'Fitness', id: 'fitness' },
    { icon: '🚗', name: t('home.auto') || 'Auto', id: 'auto' },
    { icon: '🏠', name: t('home.home') || 'Home', id: 'home' },
    { icon: '🐾', name: t('home.pets') || 'Pets', id: 'pets' },
    { icon: '🏥', name: t('home.health') || 'Health', id: 'health' },
    { icon: '⋯', name: t('common.more') || 'More', id: 'more' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>LinkUup</Text>
          <Text style={styles.headerSubtitle}>
            {t('home.hello') || 'Hello'}, {user?.name || user?.email || 'User'}!
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerProfile' as never)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder={t('nav.searchPlaceholder') || 'Search for services or businesses'}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={() => navigation.navigate('Search' as never, { query: searchQuery } as never)}
        onFocus={() => navigation.navigate('Search' as never)}
      />

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.upcomingAppointments') || 'Upcoming Appointments'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('CustomerBookings' as never)}>
            <Text style={styles.seeAllText}>{t('common.viewAll') || 'View All'}</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
        ) : upcomingBookings.length > 0 ? (
          <Card style={styles.bookingCard}>
            {upcomingBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTime}>
                    {new Date(booking.date).toLocaleDateString()}, {booking.time}
                  </Text>
                  <Text style={styles.bookingService}>{booking.service_name}</Text>
                  <Text style={styles.bookingPlace}>{booking.place_name}</Text>
                </View>
                {booking.place_image && (
                  <Image
                    source={{ uri: booking.place_image }}
                    style={styles.bookingImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.bookingActions}>
                  <Button
                    title={t('common.viewDetails') || 'View Details'}
                    onPress={() => navigation.navigate('BookingDetails' as never, { bookingId: booking.id } as never)}
                    variant="primary"
                    size="sm"
                    style={styles.bookingButton}
                  />
                  <Button
                    title={t('common.cancel') || 'Cancel'}
                    onPress={() => {}}
                    variant="secondary"
                    size="sm"
                    style={styles.bookingButton}
                  />
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('dashboard.noUpcomingAppointments') || 'No upcoming appointments'}
            </Text>
            <Button
              title={t('dashboard.bookNow') || 'Book Now'}
              onPress={() => navigation.navigate('Search' as never)}
              variant="primary"
              size="md"
              style={styles.emptyButton}
            />
          </Card>
        )}
      </View>

      {/* Rewards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('dashboard.yourRewards') || 'Your Rewards'}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerRewards' as never)}>
          <Card style={styles.rewardsCard}>
            <View style={styles.rewardsContent}>
              <Text style={styles.rewardsIcon}>🏆</Text>
              <View style={styles.rewardsInfo}>
                <Text style={styles.rewardsPoints}>
                  {t('dashboard.youHavePoints', { points: rewardsPoints }) || `You have ${rewardsPoints} Points!`}
                </Text>
                <Text style={styles.rewardsDescription}>
                  {t('dashboard.redeemForDiscounts') || 'Redeem for discounts & free services.'}
                </Text>
              </View>
              <Text style={styles.rewardsArrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Explore Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('home.exploreServices') || 'Explore Services'}
        </Text>
        <View style={styles.categoriesContainer}>
          {serviceCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Search' as never, { tipo: category.name } as never)}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bookingCard: {
    padding: theme.spacing.md,
  },
  bookingItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  bookingService: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  bookingPlace: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  bookingImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  bookingButton: {
    flex: 1,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyButton: {
    width: '100%',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
  rewardsCard: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
  },
  rewardsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  rewardsInfo: {
    flex: 1,
  },
  rewardsPoints: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  rewardsDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  rewardsArrow: {
    fontSize: theme.typography.fontSize['2xl'],
    color: '#FFFFFF',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  categoryCard: {
    width: '23%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default CustomerDashboardScreen;
