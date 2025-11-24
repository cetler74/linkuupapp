import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service_name: string;
  employee_name?: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  place_id: number;
  place_name?: string;
  total_price?: number;
}

const BookingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchBookings();
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab]);

  const fetchPlaces = async () => {
    try {
      const response = await ownerAPI.getOwnerPlaces();
      const placesList = Array.isArray(response) ? response : [];
      setPlaces(placesList);
      if (placesList.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(placesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    }
  };

  const fetchBookings = async () => {
    if (!selectedPlaceId) return;
    
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceBookings(selectedPlaceId);
      setBookings(Array.isArray(response) ? response : []);
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
        return bookingDateTime >= now && booking.status !== 'cancelled';
      } else {
        return bookingDateTime < now || booking.status === 'cancelled';
      }
    });

    setFilteredBookings(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleAccept = async (bookingId: number) => {
    try {
      await ownerAPI.updateBooking(bookingId, { status: 'confirmed' });
      fetchBookings();
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert(t('bookings.acceptError') || 'Error accepting booking');
    }
  };

  const handleDecline = async (bookingId: number) => {
    try {
      await ownerAPI.cancelBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error('Error declining booking:', error);
      alert(t('bookings.declineError') || 'Error declining booking');
    }
  };

  const handleAddBooking = () => {
    // TODO: Navigate to AddBooking screen when implemented
    alert(t('bookings.addBookingComingSoon') || 'Add booking feature coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#10b981';
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('bookings.myBookings') || 'My Bookings'}
        </Text>
      </View>

      {/* Place Selector */}
      {places.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.placeSelector}
          contentContainerStyle={styles.placeSelectorContent}
        >
          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={[
                styles.placeChip,
                selectedPlaceId === place.id && styles.placeChipActive,
              ]}
              onPress={() => setSelectedPlaceId(place.id)}
            >
              <Text
                style={[
                  styles.placeChipText,
                  selectedPlaceId === place.id && styles.placeChipTextActive,
                ]}
              >
                {place.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {t('bookings.upcoming') || 'Upcoming'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('bookings.past') || 'Past'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.bookingsList}
          contentContainerStyle={styles.bookingsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <TouchableOpacity onPress={handleAddBooking} style={styles.addBookingCard}>
            <MaterialCommunityIcons name="plus-circle" size={32} color={theme.colors.primary} />
            <Text style={styles.addBookingText}>
              {t('bookings.addNewBooking') || 'Add New Booking'}
            </Text>
          </TouchableOpacity>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={64}
                color={theme.colors.placeholderLight}
              />
              <Text style={styles.emptyTitle}>
                {t('bookings.noBookings') || 'No Bookings'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? t('bookings.noUpcomingBookings') || 'No upcoming bookings'
                  : t('bookings.noPastBookings') || 'No past bookings'}
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onAccept={handleAccept}
                onDecline={handleDecline}
                formatDateTime={formatDateTime}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

interface BookingCardProps {
  booking: Booking;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onAccept,
  onDecline,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();

  return (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.customerAvatar}>
          <Text style={styles.customerInitials}>
            {booking.customer_name[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.customerName}>{booking.customer_name}</Text>
          <Text style={styles.bookingDateTime}>
            {formatDateTime(booking.booking_date, booking.booking_time)}
          </Text>
          <Text style={styles.serviceName}>{booking.service_name}</Text>
          {booking.employee_name && (
            <Text style={styles.employeeName}>
              {t('bookings.with') || 'with'} {booking.employee_name}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>
      {booking.status === 'pending' && (
        <View style={styles.bookingActions}>
          <Button
            title={t('bookings.decline') || 'Decline'}
            onPress={() => onDecline(booking.id)}
            variant="secondary"
            size="sm"
            style={styles.actionButton}
          />
          <Button
            title={t('bookings.accept') || 'Accept'}
            onPress={() => onAccept(booking.id)}
            variant="primary"
            size="sm"
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
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
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  placeSelector: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  placeSelectorContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  placeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  placeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  placeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
  },
  placeChipTextActive: {
    color: '#FFFFFF',
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
    fontWeight: theme.typography.fontWeight.bold as '700',
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
  addBookingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginBottom: theme.spacing.md,
  },
  addBookingText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  bookingCard: {
    marginBottom: theme.spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitials: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  bookingDateTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  serviceName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  employeeName: {
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
    fontWeight: theme.typography.fontWeight.bold as '700',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
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
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});

export default BookingsScreen;
