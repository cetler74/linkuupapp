import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Card from '../ui/Card';
import BookingCard, { type Booking } from './BookingCard';
import { type PlaceEmployee } from '../../api/api';

interface PendingBookingsSectionProps {
  bookings: Booking[];
  employees?: Map<number, PlaceEmployee>;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const PendingBookingsSection: React.FC<PendingBookingsSectionProps> = ({
  bookings,
  employees,
  onAccept,
  onDecline,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  if (bookings.length === 0) {
    return null;
  }

  return (
    <Card style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{bookings.length}</Text>
          </View>
          <Text style={styles.title}>
            {t('bookings.pendingBookings') || 'Pending Bookings'}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.colors.textLight}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              employee={booking.employee_id ? employees?.get(booking.employee_id) : undefined}
              onAccept={onAccept}
              onDecline={onDecline}
              formatDateTime={formatDateTime}
              getStatusColor={getStatusColor}
            />
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#f59e0b10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  badge: {
    backgroundColor: '#f59e0b',
    borderRadius: theme.borderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});

export default PendingBookingsSection;

