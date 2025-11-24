import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../ui/Button';
import { type PlaceEmployee, getImageUrl } from '../../api/api';
import { ownerAPI } from '../../api/api';
import { type Booking } from './BookingCard';

interface BookingDetailModalProps {
  visible: boolean;
  booking: Booking | null;
  employee?: PlaceEmployee;
  onClose: () => void;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onStatusChange?: (id: number, newStatus: string) => void;
  getStatusColor: (status: string) => string;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  visible,
  booking,
  employee,
  onClose,
  onAccept,
  onDecline,
  onStatusChange,
  getStatusColor,
}) => {
  const { t } = useTranslation();
  const [fullBookingData, setFullBookingData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (visible && booking) {
      fetchBookingDetails();
    }
  }, [visible, booking]);

  const fetchBookingDetails = async () => {
    if (!booking) return;
    try {
      setLoadingDetails(true);
      const details = await ownerAPI.getBooking(booking.id);
      setFullBookingData(details);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      // Use the booking prop data if API call fails
      setFullBookingData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!booking) return null;

  const employeePhotoUrl = employee?.photo_url ? getImageUrl(employee.photo_url) : null;
  const employeeColor = employee?.color_code || theme.colors.primary;
  const statusColor = getStatusColor(booking.status);
  const isPending = booking.status === 'pending';
  const canChangeStatus = !isPending && !!onStatusChange;
  
  // Debug logging
  if (__DEV__) {
    console.log('BookingDetailModal - Status:', booking.status, 'isPending:', isPending, 'onStatusChange:', !!onStatusChange, 'canChangeStatus:', canChangeStatus);
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleAccept = () => {
    if (onAccept && booking) {
      onAccept(booking.id);
      onClose();
    }
  };

  const handleDecline = () => {
    Alert.alert(
      t('bookings.declineConfirm') || 'Decline Booking',
      t('bookings.declineConfirmMessage') || 'Are you sure you want to decline this booking?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('bookings.decline') || 'Decline',
          style: 'destructive',
          onPress: () => {
            if (onDecline && booking) {
              onDecline(booking.id);
              onClose();
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!booking || !onStatusChange) return;

    const statusLabels: Record<string, string> = {
      pending: t('bookings.pending') || 'Pending',
      confirmed: t('bookings.confirmed') || 'Confirmed',
      cancelled: t('bookings.cancelled') || 'Cancelled',
      completed: t('bookings.completed') || 'Completed',
    };

    const currentStatusLabel = statusLabels[booking.status] || booking.status;
    const newStatusLabel = statusLabels[newStatus] || newStatus;

    Alert.alert(
      t('bookings.changeStatus') || 'Change Status',
      t('bookings.changeStatusConfirm', { 
        current: currentStatusLabel, 
        new: newStatusLabel 
      }) || `Change status from ${currentStatusLabel} to ${newStatusLabel}?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.confirm') || 'Confirm',
          onPress: async () => {
            try {
              setChangingStatus(true);
              await onStatusChange(booking.id, newStatus);
              setShowStatusPicker(false);
              // Refresh booking details after status change
              await fetchBookingDetails();
            } catch (error) {
              console.error('Error changing status:', error);
              Alert.alert(
                t('common.error') || 'Error',
                t('bookings.statusChangeError') || 'Failed to change status'
              );
            } finally {
              setChangingStatus(false);
            }
          },
        },
      ]
    );
  };

  const getStatusOptions = () => {
    if (!booking) return [];
    
    const allStatuses: Array<'pending' | 'confirmed' | 'cancelled' | 'completed'> = [
      'pending',
      'confirmed',
      'cancelled',
      'completed',
    ];
    
    // Return all statuses except the current one
    return allStatuses.filter(status => status !== booking.status);
  };

  const bookingData = fullBookingData || booking;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('bookings.bookingDetails') || 'Booking Details'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Status Badge */}
          <View style={styles.statusSection}>
            <TouchableOpacity
              style={[
                styles.statusBadge, 
                { backgroundColor: statusColor + '20' },
                canChangeStatus && styles.statusBadgeClickable
              ]}
              onPress={() => canChangeStatus && setShowStatusPicker(true)}
              disabled={!canChangeStatus || changingStatus}
              activeOpacity={canChangeStatus ? 0.7 : 1}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
              {canChangeStatus && (
                <MaterialCommunityIcons 
                  name="chevron-down" 
                  size={20} 
                  color={statusColor} 
                  style={styles.statusChevron}
                />
              )}
            </TouchableOpacity>
            {isPending && (
              <View style={styles.pendingAlert}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#f59e0b" />
                <Text style={styles.pendingAlertText}>
                  {t('bookings.needsConfirmation') || 'Needs Confirmation'}
                </Text>
              </View>
            )}
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                {t('bookings.customerInformation') || 'Customer Information'}
              </Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitials}>
                    {booking.customer_name[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('bookings.customerName') || 'Name'}</Text>
                  <Text style={styles.infoValue}>{booking.customer_name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={18} color={theme.colors.placeholderLight} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('bookings.customerEmail') || 'Email'}</Text>
                  <TouchableOpacity onPress={() => handleEmail(booking.customer_email)}>
                    <Text style={[styles.infoValue, styles.linkText]}>
                      {booking.customer_email}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {booking.customer_phone && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={18} color={theme.colors.placeholderLight} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('bookings.customerPhone') || 'Phone'}</Text>
                    <TouchableOpacity onPress={() => handleCall(booking.customer_phone!)}>
                      <Text style={[styles.infoValue, styles.linkText]}>
                        {booking.customer_phone}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                {t('bookings.bookingDetails') || 'Booking Details'}
              </Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={18} color={theme.colors.placeholderLight} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('bookings.date') || 'Date'}</Text>
                  <Text style={styles.infoValue}>{formatDate(booking.booking_date)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.placeholderLight} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('bookings.time') || 'Time'}</Text>
                  <Text style={styles.infoValue}>{formatTime(booking.booking_time)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="scissors-cutting" size={18} color={theme.colors.placeholderLight} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('bookings.service') || 'Service'}</Text>
                  <Text style={styles.infoValue}>{booking.service_name}</Text>
                </View>
              </View>

              {bookingData?.duration && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="timer-outline" size={18} color={theme.colors.placeholderLight} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('bookings.duration') || 'Duration'}</Text>
                    <Text style={styles.infoValue}>
                      {bookingData.duration} {t('bookings.minutes') || 'minutes'}
                    </Text>
                  </View>
                </View>
              )}

              {booking.total_price !== undefined && booking.total_price !== null && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="currency-usd" size={18} color={theme.colors.placeholderLight} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('bookings.price') || 'Price'}</Text>
                    <Text style={styles.infoValue}>
                      ${booking.total_price.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Employee Information */}
          {booking.employee_name && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-tie" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>
                  {t('bookings.employee') || 'Employee'}
                </Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
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
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('bookings.assignedEmployee') || 'Assigned Employee'}</Text>
                    <Text style={styles.infoValue}>{booking.employee_name}</Text>
                    {employee?.role && (
                      <Text style={styles.infoSubtext}>{employee.role}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Place Information */}
          {booking.place_name && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="store" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>
                  {t('bookings.place') || 'Place'}
                </Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.placeholderLight} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('bookings.location') || 'Location'}</Text>
                    <Text style={styles.infoValue}>{booking.place_name}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Additional Information */}
          {bookingData?.notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="note-text" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>
                  {t('bookings.notes') || 'Notes'}
                </Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.notesText}>{bookingData.notes}</Text>
              </View>
            </View>
          )}

          {/* Booking ID */}
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="identifier" size={18} color={theme.colors.placeholderLight} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('bookings.bookingId') || 'Booking ID'}</Text>
                  <Text style={styles.infoValue}>#{booking.id}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        {isPending && (onAccept || onDecline) && (
          <View style={styles.actions}>
            {onDecline && (
              <Button
                title={t('bookings.decline') || 'Decline'}
                onPress={handleDecline}
                variant="secondary"
                size="lg"
                style={styles.actionButton}
              />
            )}
            {onAccept && (
              <Button
                title={t('bookings.accept') || 'Accept'}
                onPress={handleAccept}
                variant="primary"
                size="lg"
                style={styles.actionButton}
              />
            )}
          </View>
        )}
      </View>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {t('bookings.selectStatus') || 'Select Status'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowStatusPicker(false)}
                style={styles.pickerCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContent}>
              {getStatusOptions().map((status) => {
                const statusColor = getStatusColor(status);
                const statusLabels: Record<string, string> = {
                  pending: t('bookings.pending') || 'Pending',
                  confirmed: t('bookings.confirmed') || 'Confirmed',
                  cancelled: t('bookings.cancelled') || 'Cancelled',
                  completed: t('bookings.completed') || 'Completed',
                };
                return (
                  <TouchableOpacity
                    key={status}
                    style={styles.statusOption}
                    onPress={() => handleStatusChange(status)}
                    disabled={changingStatus}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statusOptionDot, { backgroundColor: statusColor }]} />
                    <Text style={styles.statusOptionText}>
                      {statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                    {changingStatus && (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
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
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  statusSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusBadgeClickable: {
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  statusChevron: {
    marginLeft: theme.spacing.xs,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#f59e0b20',
    borderRadius: theme.borderRadius.md,
  },
  pendingAlertText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: '#f59e0b',
  },
  section: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  sectionContent: {
    padding: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitials: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs / 2,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
  },
  infoSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs / 2,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  notesText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  actionButton: {
    flex: 1,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  pickerContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  pickerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  pickerCloseButton: {
    padding: theme.spacing.xs,
  },
  pickerContent: {
    padding: theme.spacing.md,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  statusOptionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusOptionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
  },
});

export default BookingDetailModal;

