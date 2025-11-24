import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import BookingCard, { type Booking } from './BookingCard';
import { type PlaceEmployee, ownerAPI } from '../../api/api';
import BookingDetailModal from './BookingDetailModal';

interface CalendarMonthViewProps {
  bookings: Booking[];
  employees?: Map<number, PlaceEmployee>;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  bookings,
  employees,
  selectedDate,
  onDateSelect,
  onAccept,
  onDecline,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const markedDates = useMemo(() => {
    const marked: any = {
      [selectedDate]: {
        selected: true,
        selectedColor: theme.colors.primary,
        selectedTextColor: '#FFFFFF',
      },
    };

    bookings.forEach((booking) => {
      const date = booking.booking_date;
      if (!marked[date]) {
        marked[date] = {
          dots: [],
          marked: true,
        };
      }

      let dotColor = theme.colors.placeholderLight;
      switch (booking.status) {
        case 'pending':
          dotColor = '#f59e0b';
          break;
        case 'confirmed':
          dotColor = '#10b981';
          break;
        case 'cancelled':
          dotColor = '#ef4444';
          break;
        case 'completed':
          dotColor = '#6b7280';
          break;
      }

      if (!marked[date].dots) {
        marked[date].dots = [];
      }
      marked[date].dots.push({
        color: dotColor,
        selectedColor: dotColor,
      });
    });

    return marked;
  }, [bookings, selectedDate]);

  const selectedDateBookings = useMemo(() => {
    return bookings.filter((booking) => booking.booking_date === selectedDate);
  }, [bookings, selectedDate]);

  const handleDayPress = (day: DateData) => {
    onDateSelect(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          todayTextColor: theme.colors.primary,
          arrowColor: theme.colors.primary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#FFFFFF',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>{t('bookings.pending') || 'Pending'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>{t('bookings.confirmed') || 'Confirmed'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>{t('bookings.cancelled') || 'Cancelled'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
          <Text style={styles.legendText}>{t('bookings.completed') || 'Completed'}</Text>
        </View>
      </View>

      <ScrollView style={styles.bookingsList} contentContainerStyle={styles.bookingsListContent}>
        {selectedDateBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={48}
              color={theme.colors.placeholderLight}
            />
            <Text style={styles.emptyText}>
              {t('bookings.noBookingsOnDate') || 'No bookings on this date'}
            </Text>
          </View>
        ) : (
          selectedDateBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              employee={booking.employee_id ? employees?.get(booking.employee_id) : undefined}
              onAccept={onAccept}
              onDecline={onDecline}
              onViewDetails={(id) => {
                setSelectedBooking(booking);
                setShowDetailModal(true);
              }}
              formatDateTime={formatDateTime}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </ScrollView>

      {/* Booking Detail Modal */}
          <BookingDetailModal
            visible={showDetailModal}
            booking={selectedBooking}
            employee={selectedBooking?.employee_id ? employees?.get(selectedBooking.employee_id) : undefined}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedBooking(null);
            }}
            onAccept={onAccept}
            onDecline={onDecline}
            onStatusChange={async (id: number, newStatus: string) => {
              try {
                await ownerAPI.updateBooking(id, { status: newStatus });
                // Refresh the booking list by calling parent's refresh if available
                // For now, just close modal - parent should refresh
              } catch (error) {
                throw error;
              }
            }}
            getStatusColor={getStatusColor}
          />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingBottom: theme.spacing.md,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  bookingsList: {
    flex: 1,
  },
  bookingsListContent: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});

export default CalendarMonthView;

