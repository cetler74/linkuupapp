import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import { ownerAPI, bookingAPI, placeAPI, type PlaceService, type PlaceEmployee, type AvailabilityResponse } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AddBookingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId } = (route.params as any) || {};
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState<PlaceService | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<PlaceEmployee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [services, setServices] = useState<PlaceService[]>([]);
  const [employees, setEmployees] = useState<PlaceEmployee[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [showEmployeeSelection, setShowEmployeeSelection] = useState(false);

  useEffect(() => {
    if (placeId) {
      fetchData();
    } else {
      Alert.alert(t('common.error') || 'Error', t('bookings.placeRequired') || 'Place ID is required');
      navigation.goBack();
    }
  }, [placeId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailability();
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate, selectedService, selectedEmployee]);

  const fetchData = async () => {
    if (!placeId) return;
    try {
      setIsLoading(true);
      const [servicesData, employeesData] = await Promise.all([
        ownerAPI.getPlaceServices(placeId),
        ownerAPI.getPlaceEmployees(placeId),
      ]);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert(t('common.error') || 'Error', t('bookings.loadError') || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedDate || !selectedService) return;
    try {
      const availability: AvailabilityResponse = await placeAPI.getAvailability(
        placeId,
        selectedDate,
        selectedService.id,
        selectedEmployee?.id
      );
      const slots = availability.available_slots || [];
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailableSlots([]);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleServiceSelect = (service: PlaceService) => {
    setSelectedService(service);
    setShowServiceSelection(false);
    // Reset employee if service changes
    setSelectedEmployee(null);
  };

  const handleEmployeeSelect = (employee: PlaceEmployee | null) => {
    setSelectedEmployee(employee);
    setShowEmployeeSelection(false);
    setSelectedTime(''); // Reset time when employee changes
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      Alert.alert(t('common.error') || 'Error', t('bookings.customerNameRequired') || 'Customer name is required');
      return false;
    }
    if (!customerEmail.trim()) {
      Alert.alert(t('common.error') || 'Error', t('bookings.customerEmailRequired') || 'Customer email is required');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      Alert.alert(t('common.error') || 'Error', t('bookings.invalidEmail') || 'Please enter a valid email address');
      return false;
    }
    if (!selectedService) {
      Alert.alert(t('common.error') || 'Error', t('bookings.serviceRequired') || 'Please select a service');
      return false;
    }
    if (!selectedDate) {
      Alert.alert(t('common.error') || 'Error', t('bookings.dateRequired') || 'Please select a date');
      return false;
    }
    if (!selectedTime) {
      Alert.alert(t('common.error') || 'Error', t('bookings.timeRequired') || 'Please select a time');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const bookingData = {
        salon_id: placeId,
        service_id: selectedService!.id,
        employee_id: selectedEmployee?.id || 0,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || undefined,
        booking_date: selectedDate,
        booking_time: selectedTime,
        any_employee_selected: !selectedEmployee,
      };

      const response = await bookingAPI.createBooking(bookingData);
      
      Alert.alert(
        t('common.success') || 'Success',
        t('bookings.bookingCreated') || 'Booking created successfully',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.response?.data?.detail || error.message || t('bookings.createError') || 'Failed to create booking'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('bookings.createBooking') || 'Create Booking'}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('bookings.createBooking') || 'Create Booking'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Customer Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('bookings.customerInformation') || 'Customer Information'}
          </Text>
          
          <Input
            placeholder={t('bookings.customerName') || 'Customer Name *'}
            value={customerName}
            onChangeText={setCustomerName}
            style={styles.input}
          />
          
          <Input
            placeholder={t('bookings.customerEmail') || 'Customer Email *'}
            value={customerEmail}
            onChangeText={setCustomerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          
          <Input
            placeholder={t('bookings.customerPhone') || 'Customer Phone (Optional)'}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </Card>

        {/* Service Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('bookings.service') || 'Service *'}
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowServiceSelection(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !selectedService && styles.selectButtonTextPlaceholder]}>
              {selectedService ? selectedService.nome : t('bookings.selectService') || 'Select Service'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.placeholderLight} />
          </TouchableOpacity>
        </Card>

        {/* Employee Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('bookings.employee') || 'Employee'}
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowEmployeeSelection(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !selectedEmployee && styles.selectButtonTextPlaceholder]}>
              {selectedEmployee ? selectedEmployee.nome : t('bookings.anyEmployee') || 'Any Employee'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.placeholderLight} />
          </TouchableOpacity>
        </Card>

        {/* Date Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('bookings.date') || 'Date *'}
          </Text>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                  selectedTextColor: '#FFFFFF',
                },
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
        </Card>

        {/* Time Selection */}
        {selectedDate && selectedService && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {t('bookings.time') || 'Time *'}
            </Text>
            {availableSlots.length > 0 ? (
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
              <Text style={styles.emptyText}>
                {t('bookings.noAvailableSlots') || 'No available time slots for this date'}
              </Text>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={isSubmitting ? (t('bookings.creating') || 'Creating...') : (t('bookings.createBooking') || 'Create Booking')}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          style={styles.submitButton}
        />
      </View>

      {/* Service Selection Modal */}
      {showServiceSelection && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('bookings.selectService') || 'Select Service'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowServiceSelection(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.modalItem,
                    selectedService?.id === service.id && styles.modalItemSelected,
                  ]}
                  onPress={() => handleServiceSelect(service)}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemText}>{service.nome}</Text>
                    <Text style={styles.modalItemSubtext}>
                      €{service.preco?.toFixed(2) || '0.00'} • {service.duracao || 0} min
                    </Text>
                  </View>
                  {selectedService?.id === service.id && (
                    <MaterialCommunityIcons name="check" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Employee Selection Modal */}
      {showEmployeeSelection && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('bookings.selectEmployee') || 'Select Employee'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowEmployeeSelection(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  !selectedEmployee && styles.modalItemSelected,
                ]}
                onPress={() => handleEmployeeSelect(null)}
              >
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemText}>
                    {t('bookings.anyEmployee') || 'Any Employee'}
                  </Text>
                </View>
                {!selectedEmployee && (
                  <MaterialCommunityIcons name="check" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              {employees.map((employee) => (
                <TouchableOpacity
                  key={employee.id}
                  style={[
                    styles.modalItem,
                    selectedEmployee?.id === employee.id && styles.modalItemSelected,
                  ]}
                  onPress={() => handleEmployeeSelect(employee)}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemText}>{employee.nome}</Text>
                  </View>
                  {selectedEmployee?.id === employee.id && (
                    <MaterialCommunityIcons name="check" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.backgroundLight,
  },
  selectButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    flex: 1,
  },
  selectButtonTextPlaceholder: {
    color: theme.colors.placeholderLight,
  },
  calendarContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
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
    fontWeight: theme.typography.fontWeight.medium as '500',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    padding: theme.spacing.md,
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
  submitButton: {
    width: '100%',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalItemSelected: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs / 2,
  },
  modalItemSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
});

export default AddBookingScreen;

