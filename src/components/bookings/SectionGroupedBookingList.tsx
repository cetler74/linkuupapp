import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import SectionBookingItem from './SectionBookingItem';
import { type Booking } from './BookingCard';
import { type PlaceEmployee } from '../../api/api';

interface SectionGroupedBookingListProps {
  bookings: Booking[];
  employees?: Map<number, PlaceEmployee>;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  onBookingPress?: (booking: Booking) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

interface BookingGroup {
  label: string;
  date: string;
  bookings: Booking[];
}

const SectionGroupedBookingList: React.FC<SectionGroupedBookingListProps> = ({
  bookings,
  employees,
  onAccept,
  onDecline,
  onBookingPress,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();

  const groupedBookings = useMemo(() => {
    const groups: BookingGroup[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const todayBookings: Booking[] = [];
    const tomorrowBookings: Booking[] = [];
    const thisWeekBookings: Booking[] = [];
    const laterBookings: Booking[] = [];

    bookings.forEach((booking) => {
      const bookingDate = booking.booking_date;
      if (bookingDate === todayStr) {
        todayBookings.push(booking);
      } else if (bookingDate === tomorrowStr) {
        tomorrowBookings.push(booking);
      } else if (bookingDate >= weekStartStr && bookingDate < todayStr) {
        thisWeekBookings.push(booking);
      } else if (bookingDate > tomorrowStr) {
        laterBookings.push(booking);
      }
    });

    // Sort bookings within each group by time
    const sortByTime = (a: Booking, b: Booking) => {
      return a.booking_time.localeCompare(b.booking_time);
    };

    if (todayBookings.length > 0) {
      groups.push({
        label: t('bookings.grouped.today') || "Today's Bookings",
        date: todayStr,
        bookings: todayBookings.sort(sortByTime),
      });
    }

    if (tomorrowBookings.length > 0) {
      groups.push({
        label: t('bookings.grouped.tomorrow') || 'Tomorrow',
        date: tomorrowStr,
        bookings: tomorrowBookings.sort(sortByTime),
      });
    }

    if (thisWeekBookings.length > 0) {
      groups.push({
        label: t('bookings.grouped.thisWeek') || 'This Week',
        date: weekStartStr,
        bookings: thisWeekBookings.sort(sortByTime),
      });
    }

    if (laterBookings.length > 0) {
      // Group later bookings by week
      const laterGroups = new Map<string, Booking[]>();
      laterBookings.forEach((booking) => {
        const date = new Date(booking.booking_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!laterGroups.has(weekKey)) {
          laterGroups.set(weekKey, []);
        }
        laterGroups.get(weekKey)!.push(booking);
      });

      laterGroups.forEach((groupBookings, weekKey) => {
        const weekDate = new Date(weekKey);
        const endDate = new Date(weekDate);
        endDate.setDate(endDate.getDate() + 6);
        const label = `${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        groups.push({
          label,
          date: weekKey,
          bookings: groupBookings.sort(sortByTime),
        });
      });
    }

    return groups;
  }, [bookings, t]);

  if (groupedBookings.length === 0) {
    return (
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
          {t('bookings.noUpcomingBookings') || 'No upcoming bookings'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {groupedBookings.map((group, groupIndex) => (
        <View key={group.date} style={styles.group}>
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons
                name="calendar"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionLabel}>{group.label}</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionCount}>{group.bookings.length}</Text>
            </View>
          </View>

          {/* Section Content */}
          <View style={styles.sectionContent}>
            {group.bookings.map((booking, index) => (
                <SectionBookingItem
                  key={booking.id}
                  booking={booking}
                  employee={booking.employee_id ? employees?.get(booking.employee_id) : undefined}
                  onAccept={onAccept}
                  onDecline={onDecline}
                  onPress={onBookingPress}
                  formatDateTime={formatDateTime}
                  getStatusColor={getStatusColor}
                  isLast={index === group.bookings.length - 1}
                />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  content: {
    paddingBottom: theme.spacing.xl,
  },
  group: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  sectionBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    minWidth: 32,
    alignItems: 'center',
  },
  sectionCount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  sectionContent: {
    backgroundColor: theme.colors.backgroundLight,
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
  },
});

export default SectionGroupedBookingList;

