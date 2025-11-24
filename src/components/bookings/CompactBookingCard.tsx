import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { type PlaceEmployee, getImageUrl } from '../../api/api';
import { type Booking } from './BookingCard';

interface CompactBookingCardProps {
  booking: Booking;
  employee?: PlaceEmployee;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onPress?: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const CompactBookingCard: React.FC<CompactBookingCardProps> = ({
  booking,
  employee,
  onAccept,
  onDecline,
  onPress,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();

  const employeePhotoUrl = employee?.photo_url ? getImageUrl(employee.photo_url) : null;
  const employeeColor = employee?.color_code || theme.colors.primary;
  const statusColor = getStatusColor(booking.status);
  const isPending = booking.status === 'pending';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(booking.id)}
      disabled={!onPress}
    >
      <Card style={[styles.card, isPending && styles.pendingCard]}>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={[styles.customerAvatar, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.customerInitials, { color: statusColor }]}>
                {booking.customer_name[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.info}>
              <View style={styles.headerRow}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {booking.customer_name}
                </Text>
                {isPending && (
                  <View style={styles.pendingBadge}>
                    <MaterialCommunityIcons name="alert-circle" size={12} color="#f59e0b" />
                  </View>
                )}
              </View>
              <Text style={styles.time} numberOfLines={1}>
                {formatDateTime(booking.booking_date, booking.booking_time)}
              </Text>
              <Text style={styles.service} numberOfLines={1}>
                {booking.service_name}
              </Text>
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
                  <Text style={styles.employeeName} numberOfLines={1}>
                    {booking.employee_name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            </View>
          </View>
        </View>

        {isPending && (onAccept || onDecline) && (
          <View style={styles.actions}>
            {onDecline && (
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => onDecline(booking.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.declineButtonText}>
                  {t('bookings.decline') || 'Decline'}
                </Text>
              </TouchableOpacity>
            )}
            {onAccept && (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => onAccept(booking.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.acceptButtonText}>
                  {t('bookings.accept') || 'Accept'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    backgroundColor: '#f59e0b08',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitials: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs / 2,
  },
  customerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    flex: 1,
  },
  pendingBadge: {
    width: 16,
    height: 16,
  },
  time: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs / 2,
  },
  service: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs / 2,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  employeeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitials: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  employeeName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    flex: 1,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
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
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  declineButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: '#FFFFFF',
  },
});

export default CompactBookingCard;

