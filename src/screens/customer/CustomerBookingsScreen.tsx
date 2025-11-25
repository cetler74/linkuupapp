import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { customerAPI, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

interface Booking {
  id: number;
  salon_id: number;
  salon_name: string;
  salon_image?: string;
  service_name: string;
  employee_name?: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  address?: string;
  total_price?: number;
}

const CustomerBookingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await customerAPI.getBookings();
      const allBookings = Array.isArray(response) ? response : response.bookings || [];
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterBookings = () => {
    const now = new Date();
    const filtered = bookings.filter(booking => {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      if (activeTab === 'upcoming') {
        return bookingDateTime >= now && booking.status !== 'cancelled' && booking.status !== 'completed';
      } else {
        return bookingDateTime < now || booking.status === 'cancelled' || booking.status === 'completed';
      }
    });
    setFilteredBookings(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await customerAPI.cancelBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(t('booking.cancelError') || 'Error cancelling booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#28A745';
      case 'pending':
        return '#FFC107';
      case 'cancelled':
        return '#DC3545';
      case 'completed':
        return '#28A745';
      default:
        return theme.colors.placeholderLight;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const bookingDate = new Date(`${date}T${time}`);
    return bookingDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      {/* Header Content */}
      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('customerBookings.myAppointments') || 'My Appointments'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {t('customerBookings.upcoming') || 'Upcoming'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('customerBookings.past') || 'Past'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>
            {t('customerBookings.noBookingsFound') || 'No bookings found'}
          </Text>
          {activeTab === 'upcoming' && (
            <Button
              title={t('customerBookings.browseSalons') || 'Browse Salons'}
              onPress={() => navigation.navigate('Search' as never)}
              variant="primary"
              size="md"
              style={styles.emptyButton}
            />
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.bookingsList}
          contentContainerStyle={styles.bookingsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredBookings.map((booking) => {
            const salonImageUrl = booking.salon_image ? getImageUrl(booking.salon_image) : null;
            const isPast = activeTab === 'past';
            
            return (
              <Card key={booking.id} style={[styles.bookingCard, isPast && styles.bookingCardPast]}>
                <View style={styles.bookingHeader}>
                  {salonImageUrl ? (
                    <Image source={{ uri: salonImageUrl }} style={styles.salonImage} />
                  ) : (
                    <View style={styles.salonImagePlaceholder}>
                      <Text style={styles.salonImageText}>
                        {booking.salon_name[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.bookingInfo}>
                    <Text style={styles.salonName}>{booking.salon_name}</Text>
                    <Text style={styles.serviceName}>{booking.service_name}</Text>
                  </View>
                  {isPast && booking.status === 'completed' && (
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        ✓ {t('booking.completed') || 'Completed'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>
                      {formatDateTime(booking.booking_date, booking.booking_time)}
                    </Text>
                  </View>
                  {booking.address && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailText}>{booking.address}</Text>
                    </View>
                  )}
                  {booking.employee_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>👤</Text>
                      <Text style={styles.detailText}>{booking.employee_name}</Text>
                    </View>
                  )}
                </View>

                {!isPast && (
                  <View style={styles.bookingActions}>
                    <Button
                      title={t('common.cancel') || 'Cancel'}
                      onPress={() => handleCancelBooking(booking.id)}
                      variant="secondary"
                      size="sm"
                      style={styles.actionButton}
                    />
                    <Button
                      title={t('booking.reschedule') || 'Reschedule'}
                      onPress={() => {
                        // Navigate to reschedule screen
                        navigation.navigate('ServiceSelection' as never, {
                          placeId: booking.salon_id,
                        } as never);
                      }}
                      variant="primary"
                      size="sm"
                      style={styles.actionButton}
                    />
                  </View>
                )}
              </Card>
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    zIndex: 1,
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    zIndex: 1,
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
  bookingsList: {
    flex: 1,
  },
  bookingsListContent: {
    padding: theme.spacing.md,
  },
  bookingCard: {
    marginBottom: theme.spacing.md,
  },
  bookingCardPast: {
    opacity: 0.7,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  salonImage: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  salonImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  salonImageText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  bookingInfo: {
    flex: 1,
  },
  salonName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  serviceName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  bookingDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailIcon: {
    fontSize: theme.typography.fontSize.base,
    marginRight: theme.spacing.sm,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 200,
  },
});

export default CustomerBookingsScreen;
