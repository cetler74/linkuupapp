import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { type PlaceEmployee, getImageUrl } from '../../api/api';

export interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service_name: string;
  employee_name?: string;
  employee_id?: number;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  place_id: number;
  place_name?: string;
  total_price?: number;
}

interface BookingCardProps {
  booking: Booking;
  employee?: PlaceEmployee;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onViewDetails?: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  employee,
  onAccept,
  onDecline,
  onViewDetails,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();

  const employeePhotoUrl = employee?.photo_url ? getImageUrl(employee.photo_url) : null;
  const employeeColor = employee?.color_code || theme.colors.primary;

  return (
    <Card style={styles.bookingCard}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onViewDetails?.(booking.id)}
        disabled={!onViewDetails}
      >
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
              <View style={styles.employeeRow}>
                {employeePhotoUrl ? (
                  <Image
                    source={{ uri: employeePhotoUrl }}
                    style={styles.employeeAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.employeeAvatar, { backgroundColor: employeeColor }]}>
                    <Text style={styles.employeeInitials}>
                      {booking.employee_name[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.employeeName}>
                  {t('bookings.with') || 'with'} {booking.employee_name}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>
        {booking.status === 'pending' && (
          <View style={styles.pendingIndicator}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#f59e0b" />
            <Text style={styles.pendingText}>
              {t('bookings.needsConfirmation') || 'Needs Confirmation'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      {booking.status === 'pending' && (onAccept || onDecline) && (
        <View style={styles.bookingActions}>
          {onDecline && (
            <Button
              title={t('bookings.decline') || 'Decline'}
              onPress={() => onDecline(booking.id)}
              variant="secondary"
              size="sm"
              style={styles.actionButton}
            />
          )}
          {onAccept && (
            <Button
              title={t('bookings.accept') || 'Accept'}
              onPress={() => onAccept(booking.id)}
              variant="primary"
              size="sm"
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
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
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  employeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitials: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
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
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f59e0b20',
    borderRadius: theme.borderRadius.md,
  },
  pendingText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: '#f59e0b',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default BookingCard;

