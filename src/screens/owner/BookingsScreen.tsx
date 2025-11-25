import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, StatusBar, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');

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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
      setLastUpdated(new Date());
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

  const hasActiveFilters = filter !== 'all' || selectedEmployeeId !== null;

  const handleClearFilters = () => {
    setFilter('all');
    setSelectedEmployeeId(null);
  };

  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return 'Today';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

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
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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

      {/* Last Updated */}
      <View style={styles.lastUpdatedContainer}>
        <Text style={styles.lastUpdatedText}>
          Last updated: {getTimeSinceUpdate()}
        </Text>
      </View>

      {/* Place Selector */}
      {places.length > 1 && (
        <View style={styles.placeSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
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
        </View>
      )}

      {/* Compact Stats Bar */}
      <View style={styles.statsContainer}>
        <CompactStatsBar
          todayCount={stats.todayCount}
          pendingCount={stats.pendingCount}
          weekTotal={stats.weekTotal}
          onStatPress={(stat) => {
            if (stat === 'today') setFilter('today');
            else if (stat === 'pending') setFilter('pending');
            else if (stat === 'week') setFilter('week');
          }}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <FilterChips
            activeFilter={filter}
            onFilterChange={setFilter}
            selectedEmployeeId={selectedEmployeeId}
          />
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={handleClearFilters}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.primary} />
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions Bar */}
      <View style={styles.quickActionsBar}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleAddBooking}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.quickActionText}>New Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setFilter('today')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="calendar-today" size={20} color={theme.colors.primary} />
          <Text style={styles.quickActionText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setFilter('pending')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="clock-alert-outline" size={20} color={theme.colors.warning} />
          <Text style={styles.quickActionText}>Pending</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          {/* Skeleton Loading */}
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonHeader}>
                  <View style={styles.skeletonCircle} />
                  <View style={styles.skeletonTextContainer}>
                    <View style={[styles.skeletonText, { width: '60%' }]} />
                    <View style={[styles.skeletonText, { width: '40%', marginTop: 8 }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name={hasActiveFilters ? "filter-remove" : "calendar-blank"}
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyStateTitle}>
            {hasActiveFilters
              ? 'No bookings match your filters'
              : bookings.length === 0
                ? 'No bookings yet'
                : 'No upcoming bookings'}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {hasActiveFilters
              ? 'Try adjusting your filters to see more results'
              : bookings.length === 0
                ? 'Create your first booking to get started'
                : 'All bookings are in the past'}
          </Text>
          {hasActiveFilters ? (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleClearFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleAddBooking}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyStateButtonText}>Create Booking</Text>
            </TouchableOpacity>
          )}
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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  placeSelectorContainer: {
    paddingVertical: theme.spacing.md,
  },
  placeSelectorContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  placeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  placeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  placeChipTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statsContainer: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  filterContainer: {
    marginBottom: theme.spacing.sm,
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
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  lastUpdatedContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: 4,
    ...theme.shadows.sm,
  },
  clearFiltersText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  quickActionsBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  quickActionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  emptyStateButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.borderLight,
    marginRight: theme.spacing.md,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonText: {
    height: 12,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 6,
  },
});

export default BookingsScreen;
