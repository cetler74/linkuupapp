import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { type PlaceEmployee, getImageUrl } from '../../api/api';
import { type Booking } from './BookingCard';

interface SectionBookingItemProps {
  booking: Booking;
  employee?: PlaceEmployee;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onPress?: (booking: Booking) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
  isLast?: boolean;
}

const SectionBookingItem: React.FC<SectionBookingItemProps> = ({
  booking,
  employee,
  onAccept,
  onDecline,
  onPress,
  formatDateTime,
  getStatusColor,
  isLast = false,
}) => {
  const { t } = useTranslation();

  const employeePhotoUrl = employee?.photo_url ? getImageUrl(employee.photo_url) : null;
  const employeeColor = employee?.color_code || theme.colors.primary;
  const statusColor = getStatusColor(booking.status);
  const isPending = booking.status === 'pending';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isLast && styles.withBorder,
        isPending && styles.pendingContainer,
      ]}
      activeOpacity={0.7}
      onPress={() => onPress?.(booking)}
    >
      <View style={styles.content}>
        {/* Left: Avatar and Info */}
        <View style={styles.leftSection}>
          <View style={[styles.avatar, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.avatarText, { color: statusColor }]}>
              {booking.customer_name[0].toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.info}>
            <View style={styles.headerRow}>
              <Text style={styles.customerName} numberOfLines={1}>
                {booking.customer_name}
              </Text>
              {isPending && (
                <View style={styles.pendingIndicator}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color="#f59e0b" />
                </View>
              )}
            </View>
            
            <View style={styles.detailsRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.placeholderLight} />
              <Text style={styles.time}>
                {formatDateTime(booking.booking_date, booking.booking_time)}
              </Text>
            </View>
            
            <View style={styles.detailsRow}>
              <MaterialCommunityIcons name="scissors-cutting" size={14} color={theme.colors.placeholderLight} />
              <Text style={styles.service} numberOfLines={1}>
                {booking.service_name}
              </Text>
            </View>
            
            {booking.employee_name && (
              <View style={styles.detailsRow}>
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

        {/* Right: Status and Actions */}
        <View style={styles.rightSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
        </View>
      </View>

      {/* Actions Row (for pending bookings) */}
      {isPending && (onAccept || onDecline) && (
        <View style={styles.actionsRow}>
          {onDecline && (
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => onDecline(booking.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={16} color={theme.colors.textLight} />
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
              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>
                {t('bookings.accept') || 'Accept'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  pendingContainer: {
    backgroundColor: '#f59e0b08',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
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
  pendingIndicator: {
    marginLeft: 'auto',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  time: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  service: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    flex: 1,
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
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    flex: 1,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.spacing.xs,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.borderLight,
  },
  declineButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: '#FFFFFF',
  },
});

export default SectionBookingItem;

