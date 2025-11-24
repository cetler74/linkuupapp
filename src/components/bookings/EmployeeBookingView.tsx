import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { theme } from '../../theme/theme';
import Card from '../ui/Card';
import { type PlaceEmployee, getImageUrl } from '../../api/api';
import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarDayView from './CalendarDayView';
import BookingCard, { type Booking } from './BookingCard';
import ViewModeTabs, { type ViewMode } from './ViewModeTabs';

interface EmployeeBookingViewProps {
  employees: PlaceEmployee[];
  bookings: Booking[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  formatDateTime: (date: string, time: string) => string;
  getStatusColor: (status: string) => string;
}

const EmployeeBookingView: React.FC<EmployeeBookingViewProps> = ({
  employees,
  bookings,
  selectedDate,
  onDateSelect,
  onAccept,
  onDecline,
  formatDateTime,
  getStatusColor,
}) => {
  const { t } = useTranslation();
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
  const [calendarViewMode, setCalendarViewMode] = useState<ViewMode>('month');

  const employeesMap = useMemo(() => {
    const map = new Map<number, PlaceEmployee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const filteredBookings = useMemo(() => {
    if (selectedEmployeeIds.size === 0) return bookings;
    return bookings.filter((b) => b.employee_id && selectedEmployeeIds.has(b.employee_id));
  }, [bookings, selectedEmployeeIds]);

  const toggleEmployeeSelection = (employeeId: number) => {
    const newSelection = new Set(selectedEmployeeIds);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedEmployeeIds(newSelection);
  };

  const selectAllEmployees = () => {
    const allIds = new Set(employees.map((e) => e.id));
    setSelectedEmployeeIds(allIds);
  };

  const clearSelection = () => {
    setSelectedEmployeeIds(new Set());
  };

  const employeeStats = useMemo(() => {
    const stats = new Map<number, { today: number; week: number }>();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    bookings.forEach((booking) => {
      if (!booking.employee_id) return;
      if (!stats.has(booking.employee_id)) {
        stats.set(booking.employee_id, { today: 0, week: 0 });
      }
      const stat = stats.get(booking.employee_id)!;
      if (booking.booking_date === today) {
        stat.today++;
      }
      if (booking.booking_date >= weekStartStr) {
        stat.week++;
      }
    });

    return stats;
  }, [bookings]);

  return (
    <View style={styles.container}>
      {/* Employee Selector Bar */}
      <View style={styles.employeeSelectorContainer}>
        <View style={styles.employeeSelectorHeader}>
          <Text style={styles.employeeSelectorTitle}>
            {t('bookings.selectEmployees') || 'Select Employees'}
          </Text>
          <View style={styles.selectorActions}>
            {selectedEmployeeIds.size > 0 && (
              <TouchableOpacity onPress={clearSelection} style={styles.selectorActionButton}>
                <Text style={styles.selectorActionText}>
                  {t('bookings.clearAll') || 'Clear'}
                </Text>
              </TouchableOpacity>
            )}
            {selectedEmployeeIds.size < employees.length && (
              <TouchableOpacity onPress={selectAllEmployees} style={styles.selectorActionButton}>
                <Text style={styles.selectorActionText}>
                  {t('bookings.selectAll') || 'Select All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.employeeSelectorScroll}
        >
          {employees.map((employee) => {
            const isSelected = selectedEmployeeIds.has(employee.id);
            const photoUrl = employee.photo_url ? getImageUrl(employee.photo_url) : null;
            const employeeColor = employee.color_code || theme.colors.primary;

            return (
              <TouchableOpacity
                key={employee.id}
                onPress={() => toggleEmployeeSelection(employee.id)}
                style={[
                  styles.employeeSelectorItem,
                  isSelected && styles.employeeSelectorItemSelected,
                  !isSelected && styles.employeeSelectorItemGrayed,
                ]}
                activeOpacity={0.7}
              >
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={[
                      styles.employeeSelectorAvatar,
                      isSelected && styles.employeeSelectorAvatarSelected,
                      !isSelected && styles.employeeSelectorAvatarGrayed,
                    ]}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.employeeSelectorAvatar,
                      { backgroundColor: employeeColor },
                      isSelected && styles.employeeSelectorAvatarSelected,
                      !isSelected && styles.employeeSelectorAvatarGrayed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.employeeSelectorInitials,
                        !isSelected && styles.employeeSelectorInitialsGrayed,
                      ]}
                    >
                      {employee.name[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
                  </View>
                )}
                <Text
                  style={[
                    styles.employeeSelectorName,
                    !isSelected && styles.employeeSelectorNameGrayed,
                  ]}
                  numberOfLines={1}
                >
                  {employee.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* View Mode Tabs */}
      <ViewModeTabs activeMode={calendarViewMode} onModeChange={setCalendarViewMode} />

      {/* Calendar Views */}
      {calendarViewMode === 'month' && (
        <CalendarMonthView
          bookings={filteredBookings}
          employees={employeesMap}
          selectedDate={selectedDate}
          selectedEmployeeIds={selectedEmployeeIds}
          onDateSelect={onDateSelect}
          onAccept={onAccept}
          onDecline={onDecline}
          formatDateTime={formatDateTime}
          getStatusColor={getStatusColor}
        />
      )}

      {calendarViewMode === 'week' && (
        <CalendarWeekView
          bookings={filteredBookings}
          employees={employeesMap}
          selectedDate={selectedDate}
          selectedEmployeeIds={selectedEmployeeIds}
          onDateSelect={onDateSelect}
          onAccept={onAccept}
          onDecline={onDecline}
          formatDateTime={formatDateTime}
          getStatusColor={getStatusColor}
        />
      )}

      {calendarViewMode === 'day' && (
        <CalendarDayView
          bookings={filteredBookings}
          employees={employeesMap}
          selectedDate={selectedDate}
          selectedEmployeeIds={selectedEmployeeIds}
          onDateChange={onDateSelect}
          onAccept={onAccept}
          onDecline={onDecline}
          formatDateTime={formatDateTime}
          getStatusColor={getStatusColor}
        />
      )}
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  employeeSelectorContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingVertical: theme.spacing.md,
  },
  employeeSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  employeeSelectorTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  selectorActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  selectorActionButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selectorActionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium as '500',
  },
  employeeSelectorScroll: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  employeeSelectorItem: {
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    position: 'relative',
  },
  employeeSelectorItemSelected: {
    opacity: 1,
  },
  employeeSelectorItemGrayed: {
    opacity: 0.4,
  },
  employeeSelectorAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  employeeSelectorAvatarSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  employeeSelectorAvatarGrayed: {
    opacity: 0.5,
  },
  employeeSelectorInitials: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  employeeSelectorInitialsGrayed: {
    opacity: 0.6,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.backgroundLight,
  },
  employeeSelectorName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    maxWidth: 60,
    textAlign: 'center',
  },
  employeeSelectorNameGrayed: {
    color: theme.colors.placeholderLight,
  },
});

export default EmployeeBookingView;

