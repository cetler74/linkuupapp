import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { theme } from '../../theme/theme';
import Card from '../ui/Card';
import BookingCard, { type Booking } from './BookingCard';
import { type PlaceEmployee, getImageUrl, ownerAPI } from '../../api/api';
import BookingDetailModal from './BookingDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 80;
const TIME_COLUMN_WIDTH = 60;

interface CalendarDayViewProps {
  bookings: Booking[];
  employees?: Map<number, PlaceEmployee>;
  selectedDate: string;
  selectedEmployeeIds?: Set<number>;
  onDateChange: (date: string) => void;
  onBookingPress?: (booking: Booking) => void;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  bookings,
  employees,
  selectedDate,
  selectedEmployeeIds,
  onDateChange,
  onBookingPress,
  onAccept,
  onDecline,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const selectedDateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
  const dayBookings = useMemo(() => {
    return bookings
      .filter((b) => b.booking_date === selectedDate)
      .sort((a, b) => {
        const timeA = a.booking_time.split(':').map(Number);
        const timeB = b.booking_time.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
  }, [bookings, selectedDate]);

  const timeSlots = useMemo(() => {
    const slots: { hour: number; label: string; top: number }[] = [];
    for (let hour = 8; hour < 20; hour++) {
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        top: (hour - 8) * HOUR_HEIGHT,
      });
    }
    return slots;
  }, []);

  const getBookingPosition = (booking: Booking) => {
    const [hours, minutes] = booking.booking_time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = totalMinutes - 8 * 60; // 8 AM start
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    
    // Duration in minutes (default 60 if not available)
    const duration = 60;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 60);
    
    return { top, height };
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(date.toISOString().split('T')[0]);
  };

  const jumpToCurrentTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 8 && currentHour < 20) {
      const scrollPosition = (currentHour - 8) * HOUR_HEIGHT;
      scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
    }
  };

  const isToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateDay('prev')} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>
            {selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {isToday && (
            <TouchableOpacity onPress={jumpToCurrentTime} style={styles.todayButton}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.todayButtonText}>
                {t('bookings.jumpToNow') || 'Jump to Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigateDay('next')} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.timelineContainer}
        contentContainerStyle={styles.timelineContent}
      >
        <View style={styles.timeline}>
          <View style={styles.timeColumn}>
            {timeSlots.map((slot) => (
              <View key={slot.hour} style={[styles.timeSlot, { top: slot.top }]}>
                <Text style={styles.timeText}>{slot.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bookingsColumn}>
            {dayBookings.map((booking) => {
              const { top, height } = getBookingPosition(booking);
              const employee = booking.employee_id ? employees?.get(booking.employee_id) : undefined;
              const employeePhotoUrl = employee?.photo_url ? getImageUrl(employee.photo_url) : null;
              const employeeColor = employee?.color_code || theme.colors.primary;
              const statusColor = getStatusColor(booking.status);
              
              // Use employee color when comparing multiple employees, otherwise use status color
              const borderColor = selectedEmployeeIds && selectedEmployeeIds.size > 1 
                ? employeeColor 
                : statusColor;
              const indicatorColor = selectedEmployeeIds && selectedEmployeeIds.size > 1
                ? employeeColor
                : statusColor;

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={[
                    styles.bookingCard,
                    {
                      top,
                      minHeight: height,
                    },
                  ]}
                  onPress={() => {
                    setSelectedBooking(booking);
                    setShowDetailModal(true);
                    onBookingPress?.(booking);
                  }}
                >
                  <Card style={[styles.bookingCardContent, { borderLeftColor: borderColor }]}>
                    <View style={styles.bookingCardHeader}>
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
                      <View style={styles.bookingCardInfo}>
                        <Text style={styles.bookingCardCustomer}>{booking.customer_name}</Text>
                        <Text style={styles.bookingCardService}>{booking.service_name}</Text>
                        <Text style={styles.bookingCardTime}>
                          {booking.booking_time}
                          {employee && ` • ${booking.employee_name}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: indicatorColor + '20' },
                        ]}
                      >
                        <View style={[styles.statusDot, { backgroundColor: indicatorColor }]} />
                      </View>
                    </View>
                    {booking.status === 'pending' && (
                      <View style={styles.pendingActions}>
                        {onDecline && (
                          <TouchableOpacity
                            style={styles.pendingActionButton}
                            onPress={() => onDecline(booking.id)}
                          >
                            <Text style={styles.pendingActionText}>
                              {t('bookings.decline') || 'Decline'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {onAccept && (
                          <TouchableOpacity
                            style={[styles.pendingActionButton, styles.acceptButton]}
                            onPress={() => onAccept(booking.id)}
                          >
                            <Text style={[styles.pendingActionText, styles.acceptButtonText]}>
                              {t('bookings.accept') || 'Accept'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}

            {dayBookings.length === 0 && (
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
            )}
          </View>
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
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  navButton: {
    padding: theme.spacing.xs,
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '10',
  },
  todayButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium as '500',
  },
  timelineContainer: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: theme.spacing.xl,
  },
  timeline: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: HOUR_HEIGHT * 12,
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
  },
  timeSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    paddingLeft: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  bookingsColumn: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: theme.spacing.md,
  },
  bookingCard: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  bookingCardContent: {
    borderLeftWidth: 4,
    padding: theme.spacing.md,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bookingEmployeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
  },
  bookingEmployeeInitials: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  bookingCardInfo: {
    flex: 1,
  },
  bookingCardCustomer: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  bookingCardService: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs / 2,
  },
  bookingCardTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs / 2,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  pendingActionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  pendingActionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
  },
  acceptButtonText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});

export default CalendarDayView;

