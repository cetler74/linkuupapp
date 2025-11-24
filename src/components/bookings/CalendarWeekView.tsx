import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { theme } from '../../theme/theme';
import BookingCard, { type Booking } from './BookingCard';
import { type PlaceEmployee, getImageUrl, ownerAPI } from '../../api/api';
import BookingDetailModal from './BookingDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 60;
const DAY_WIDTH = (SCREEN_WIDTH - 80) / 7;

interface CalendarWeekViewProps {
  bookings: Booking[];
  employees?: Map<number, PlaceEmployee>;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onBookingPress?: (booking: Booking) => void;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  bookings,
  employees,
  selectedDate,
  onDateSelect,
  onBookingPress,
  onAccept,
  onDecline,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  });

  const weekDays = useMemo(() => {
    const days: { date: Date; dateString: string; label: string }[] = [];
    const startDate = new Date(currentWeek);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date,
        dateString: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return days;
  }, [currentWeek]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const bookingsByDayAndTime = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const key = `${booking.booking_date}-${booking.booking_time}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(booking);
    });
    return map;
  }, [bookings]);

  const getBookingPosition = (booking: Booking) => {
    const [hours, minutes] = booking.booking_time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = totalMinutes - 8 * 60; // 8 AM start
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    
    // Duration in minutes (default 60 if not available)
    const duration = 60;
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          {weekDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
          {weekDays[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weekContainer}>
          <View style={styles.timeColumn}>
            {timeSlots.map((time) => (
              <View key={time} style={styles.timeSlot}>
                <Text style={styles.timeText}>{time}</Text>
              </View>
            ))}
          </View>

          {weekDays.map((day) => {
            const dayBookings = bookings.filter((b) => b.booking_date === day.dateString);
            return (
              <View key={day.dateString} style={styles.dayColumn}>
                <TouchableOpacity
                  style={[
                    styles.dayHeader,
                    isToday(day.dateString) && styles.dayHeaderToday,
                    selectedDate === day.dateString && styles.dayHeaderSelected,
                  ]}
                  onPress={() => onDateSelect(day.dateString)}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      isToday(day.dateString) && styles.dayLabelToday,
                    ]}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      isToday(day.dateString) && styles.dayDateToday,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dayContent}>
                  {dayBookings.map((booking) => {
                    const { top, height } = getBookingPosition(booking);
                    const employee = booking.employee_id ? employees?.get(booking.employee_id) : undefined;
                    const employeePhotoUrl = employee?.photo_url ? getImageUrl(employee.photo_url) : null;
                    const employeeColor = employee?.color_code || theme.colors.primary;
                    const statusColor = getStatusColor(booking.status);

                    return (
                      <TouchableOpacity
                        key={booking.id}
                        style={[
                          styles.bookingBlock,
                          {
                            top,
                            height: Math.max(height, 40),
                            backgroundColor: statusColor + '20',
                            borderLeftColor: statusColor,
                          },
                        ]}
                        onPress={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                          onBookingPress?.(booking);
                        }}
                      >
                        <View style={styles.bookingBlockContent}>
                          {employeePhotoUrl ? (
                            <Image
                              source={{ uri: employeePhotoUrl }}
                              style={styles.bookingEmployeeAvatar}
                              contentFit="cover"
                            />
                          ) : employee ? (
                            <View style={[styles.bookingEmployeeAvatar, { backgroundColor: employeeColor }]}>
                              <Text style={styles.bookingEmployeeInitials}>
                                {booking.employee_name?.[0]?.toUpperCase() || 'E'}
                              </Text>
                            </View>
                          ) : null}
                          <View style={styles.bookingBlockText}>
                            <Text style={styles.bookingBlockCustomer} numberOfLines={1}>
                              {booking.customer_name}
                            </Text>
                            <Text style={styles.bookingBlockService} numberOfLines={1}>
                              {booking.service_name}
                            </Text>
                            <Text style={styles.bookingBlockTime}>
                              {booking.booking_time}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  navButton: {
    padding: theme.spacing.xs,
  },
  weekLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  weekContainer: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  dayColumn: {
    width: DAY_WIDTH,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
  },
  dayHeader: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  dayHeaderToday: {
    backgroundColor: theme.colors.primary + '10',
  },
  dayHeaderSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  dayLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    fontWeight: theme.typography.fontWeight.medium as '500',
  },
  dayLabelToday: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold as '700',
  },
  dayDate: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs / 2,
  },
  dayDateToday: {
    color: theme.colors.primary,
  },
  dayContent: {
    position: 'relative',
    minHeight: HOUR_HEIGHT * 12,
  },
  bookingBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderLeftWidth: 3,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
    marginBottom: 2,
  },
  bookingBlockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bookingEmployeeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingEmployeeInitials: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  bookingBlockText: {
    flex: 1,
  },
  bookingBlockCustomer: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  bookingBlockService: {
    fontSize: 10,
    color: theme.colors.placeholderLight,
  },
  bookingBlockTime: {
    fontSize: 10,
    color: theme.colors.placeholderLight,
    marginTop: 2,
  },
});

export default CalendarWeekView;

