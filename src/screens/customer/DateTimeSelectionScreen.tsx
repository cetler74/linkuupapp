import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import { placeAPI, bookingAPI, type AvailabilityResponse } from '../../api/api';
import { scheduleBookingReminder } from '../../services/notifications';
import { theme } from '../../theme/theme';
import Button from '../../components/ui/Button';

const DateTimeSelectionScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { placeId, placeName, selectedServices, selectedEmployee, totalPrice, totalDuration } = (route.params as any) || {};
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability();
    }
  }, [selectedDate, selectedServices, selectedEmployee]);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const serviceId = selectedServices && selectedServices.length > 0 ? selectedServices[0] : undefined;
      const availability: AvailabilityResponse = await placeAPI.getAvailability(
        placeId,
        selectedDate,
        serviceId,
        selectedEmployee || undefined
      );
      
      const slots = availability.available_slots || [];
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinue = async () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    try {
      // Create booking
      const bookingData = {
        salon_id: placeId,
        service_ids: selectedServices,
        booking_date: selectedDate,
        booking_time: `${selectedDate}T${selectedTime}:00`,
        employee_id: selectedEmployee || 0,
        any_employee_selected: selectedEmployee === null,
      };

      const response = await bookingAPI.createBooking(bookingData);
      
      // Schedule booking reminder notification (1 hour before)
      try {
        const serviceNames = selectedServices?.map((id: number) => `Service ${id}`).join(', ') || 'Service';
        await scheduleBookingReminder(
          response.id,
          selectedDate,
          selectedTime,
          'You', // Customer name - could be fetched from auth context
          serviceNames,
          60 // 60 minutes before
        );
      } catch (error) {
        console.error('Error scheduling reminder:', error);
        // Don't fail the booking if reminder scheduling fails
      }
      
      navigation.navigate('BookingConfirmation' as never, {
        bookingId: response.id,
        placeName,
        selectedDate,
        selectedTime,
        totalPrice,
      } as never);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      // Show error message
      alert(error.response?.data?.detail || error.message || t('booking.errorCreating') || 'Error creating booking');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('booking.selectDateTime') || 'Select Date & Time'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: theme.colors.primary,
                selectedTextColor: '#FFFFFF',
              },
              ...markedDates,
            }}
            minDate={new Date().toISOString().split('T')[0]}
            theme={{
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: '#FFFFFF',
            }}
          />
        </View>

        {/* Time Slots */}
        {selectedDate && (
          <View style={styles.timeSlotsContainer}>
            <Text style={styles.timeSlotsTitle}>
              {t('booking.availableTimes') || 'Available Times'}
            </Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : availableSlots.length > 0 ? (
              <View style={styles.timeSlotsGrid}>
                {availableSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                      onPress={() => handleTimeSelect(time)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          isSelected && styles.timeSlotTextSelected,
                        ]}
                      >
                        {formatTime(time)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t('booking.noAvailableSlots') || 'No available time slots for this date'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      {selectedDate && selectedTime && (
        <View style={styles.bottomBar}>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {new Date(selectedDate).toLocaleDateString()} at {formatTime(selectedTime)}
            </Text>
            <Text style={styles.summaryPrice}>€{totalPrice.toFixed(2)}</Text>
          </View>
          <Button
            title={t('booking.confirmBooking') || 'Confirm Booking'}
            onPress={handleContinue}
            variant="primary"
            size="lg"
            style={styles.confirmButton}
          />
        </View>
      )}
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.textLight,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  calendarContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  timeSlotsContainer: {
    marginTop: theme.spacing.md,
  },
  timeSlotsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.backgroundLight,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeSlotText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    padding: theme.spacing.md,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  summaryPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  confirmButton: {
    width: '100%',
  },
});

export default DateTimeSelectionScreen;

