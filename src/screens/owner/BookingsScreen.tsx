import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ownerAPI, type Place, type PlaceEmployee } from '../../api/api';
import { theme } from '../../theme/theme';
import CompactStatsBar from '../../components/bookings/CompactStatsBar';
import FilterChips, { type FilterType } from '../../components/bookings/FilterChips';
import SectionGroupedBookingList from '../../components/bookings/SectionGroupedBookingList';
import CalendarMonthView from '../../components/bookings/CalendarMonthView';
import EmployeeBookingView from '../../components/bookings/EmployeeBookingView';
import BookingDetailModal from '../../components/bookings/BookingDetailModal';
import { type Booking } from '../../components/bookings/BookingCard';
import Logo from '../../components/common/Logo';

const BookingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<PlaceEmployee[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchBookings();
      fetchEmployees();
    }
  }, [selectedPlaceId]);

  const employeesMap = useMemo(() => {
    const map = new Map<number, PlaceEmployee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

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

  const fetchEmployees = async () => {
    if (!selectedPlaceId) return;
    try {
      const response = await ownerAPI.getPlaceEmployees(selectedPlaceId);
      setEmployees(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchBookings = async () => {
    if (!selectedPlaceId) return [];
    
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceBookings(selectedPlaceId);
      const bookingsList = Array.isArray(response) ? response : [];
      setBookings(bookingsList);
      return bookingsList;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      return [];
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
    fetchEmployees();
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
      await ownerAPI.updateBooking(bookingId, { status: 'cancelled' });
      fetchBookings();
    } catch (error) {
      console.error('Error declining booking:', error);
      alert(t('bookings.declineError') || 'Error declining booking');
    }
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await ownerAPI.updateBooking(bookingId, { status: newStatus });
      const updatedBookings = await fetchBookings();
      // Update selectedBooking if it's the one that was changed
      if (selectedBooking && selectedBooking.id === bookingId) {
        const updatedBooking = updatedBookings.find(b => b.id === bookingId);
        if (updatedBooking) {
          setSelectedBooking(updatedBooking);
        } else {
          // If booking not found in list, fetch it directly
          try {
            const bookingDetails = await ownerAPI.getBooking(bookingId);
            setSelectedBooking(bookingDetails);
          } catch (err) {
            console.error('Error fetching updated booking:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error changing booking status:', error);
      throw error; // Re-throw to let modal handle the error display
    }
  };

  const handleAddBooking = () => {
    if (!selectedPlaceId) {
      alert(t('bookings.selectPlaceFirst') || 'Please select a place first');
      return;
    }
    // Navigate to booking creation screen
    // Note: This screen needs to be created - for now it will show an error
    // but the navigation structure is in place
    (navigation as any).navigate('AddBooking', { placeId: selectedPlaceId });
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
        return '#6b7280';
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

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const todayCount = bookings.filter((b) => b.booking_date === today).length;
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;
    const weekTotal = bookings.filter((b) => b.booking_date >= weekStartStr).length;

    return { todayCount, pendingCount, weekTotal };
  }, [bookings]);

  // Filter bookings based on active filter
  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const now = new Date();

    let filtered = bookings.filter((booking) => {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      return bookingDateTime >= now && booking.status !== 'cancelled';
    });

    switch (filter) {
      case 'pending':
        filtered = filtered.filter((b) => b.status === 'pending');
        break;
      case 'today':
        filtered = filtered.filter((b) => b.booking_date === today);
        break;
      case 'week':
        filtered = filtered.filter((b) => b.booking_date >= weekStartStr);
        break;
      case 'employee':
        if (selectedEmployeeId) {
          filtered = filtered.filter((b) => b.employee_id === selectedEmployeeId);
        }
        break;
      case 'all':
      default:
        break;
    }

    // Always show pending first
    return filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      const dateA = new Date(`${a.booking_date}T${a.booking_time}`);
      const dateB = new Date(`${b.booking_date}T${b.booking_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [bookings, filter, selectedEmployeeId]);

  const pendingBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'pending');
  }, [bookings]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('bookings.myBookings') || 'Bookings'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {pendingBookings.length > 0 && (
            <TouchableOpacity
              style={styles.pendingBadge}
              onPress={() => setFilter('pending')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bell" size={20} color="#FFFFFF" />
              <Text style={styles.pendingBadgeText}>{pendingBookings.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCalendarModal(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="calendar" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowEmployeeModal(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-group" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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

      {/* Compact Stats Bar */}
      <CompactStatsBar
        todayCount={stats.todayCount}
        pendingCount={stats.pendingCount}
        weekTotal={stats.weekTotal}
        onTodayPress={() => setFilter('today')}
        onPendingPress={() => setFilter('pending')}
        onWeekPress={() => setFilter('week')}
      />

      {/* Filter Chips */}
      <FilterChips
        activeFilter={filter}
        onFilterChange={setFilter}
        selectedEmployeeId={selectedEmployeeId}
      />

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <SectionGroupedBookingList
          bookings={filteredBookings}
          employees={employeesMap}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onBookingPress={(booking) => {
            setSelectedBooking(booking);
            setShowBookingDetail(true);
          }}
          formatDateTime={formatDateTime}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        visible={showBookingDetail}
        booking={selectedBooking}
        employee={selectedBooking?.employee_id ? employeesMap.get(selectedBooking.employee_id) : undefined}
        onClose={() => {
          setShowBookingDetail(false);
          setSelectedBooking(null);
        }}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onStatusChange={handleStatusChange}
        getStatusColor={getStatusColor}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddBooking}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('bookings.calendar') || 'Calendar'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCalendarModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>
          <CalendarMonthView
            bookings={bookings}
            employees={employeesMap}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setFilter('all');
            }}
            onAccept={handleAccept}
            onDecline={handleDecline}
            formatDateTime={formatDateTime}
            getStatusColor={getStatusColor}
          />
        </View>
      </Modal>

      {/* Employee Filter Modal */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('bookings.selectEmployee') || 'Select Employee'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowEmployeeModal(false);
                setSelectedEmployeeId(null);
                setFilter('all');
              }}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>
          <EmployeeBookingView
            employees={employees}
            bookings={bookings}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onAccept={handleAccept}
            onDecline={handleDecline}
            formatDateTime={formatDateTime}
            getStatusColor={getStatusColor}
          />
        </View>
      </Modal>
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
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs / 2,
  },
  pendingBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  headerButton: {
    padding: theme.spacing.xs,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
});

export default BookingsScreen;
