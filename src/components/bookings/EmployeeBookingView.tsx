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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<ViewMode>('month');

  const employeesMap = useMemo(() => {
    const map = new Map<number, PlaceEmployee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const filteredBookings = useMemo(() => {
    if (!selectedEmployeeId) return bookings;
    return bookings.filter((b) => b.employee_id === selectedEmployeeId);
  }, [bookings, selectedEmployeeId]);

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

  if (selectedEmployeeId) {
    const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSelectedEmployeeId(null)}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {selectedEmployee?.photo_url ? (
              <Image
                source={{ uri: getImageUrl(selectedEmployee.photo_url) }}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.headerAvatar,
                  { backgroundColor: selectedEmployee?.color_code || theme.colors.primary },
                ]}
              >
                <Text style={styles.headerInitials}>
                  {selectedEmployee?.name[0].toUpperCase() || 'E'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.headerName}>{selectedEmployee?.name}</Text>
              {selectedEmployee?.role && (
                <Text style={styles.headerRole}>{selectedEmployee.role}</Text>
              )}
            </View>
          </View>
        </View>

        <ViewModeTabs activeMode={calendarViewMode} onModeChange={setCalendarViewMode} />

        {calendarViewMode === 'month' && (
          <CalendarMonthView
            bookings={filteredBookings}
            employees={employeesMap}
            selectedDate={selectedDate}
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
            onDateChange={onDateSelect}
            onAccept={onAccept}
            onDecline={onDecline}
            formatDateTime={formatDateTime}
            getStatusColor={getStatusColor}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {t('bookings.employeeSchedule') || 'Employee Schedule'}
        </Text>
        <Text style={styles.listSubtitle}>
          {t('bookings.selectEmployeeToView') || 'Select an employee to view their bookings'}
        </Text>
      </View>

      <ScrollView style={styles.employeesList} contentContainerStyle={styles.employeesListContent}>
        {employees.map((employee) => {
          const stats = employeeStats.get(employee.id) || { today: 0, week: 0 };
          const photoUrl = employee.photo_url ? getImageUrl(employee.photo_url) : null;
          const employeeColor = employee.color_code || theme.colors.primary;

          return (
            <TouchableOpacity
              key={employee.id}
              onPress={() => setSelectedEmployeeId(employee.id)}
              activeOpacity={0.7}
            >
              <Card style={styles.employeeCard}>
                <View style={styles.employeeCardContent}>
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.employeeAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.employeeAvatar, { backgroundColor: employeeColor }]}>
                      <Text style={styles.employeeInitials}>
                        {employee.name[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>{employee.name}</Text>
                    {employee.role && (
                      <Text style={styles.employeeRole}>{employee.role}</Text>
                    )}
                    <View style={styles.employeeStats}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons
                          name="calendar-today"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.statText}>
                          {stats.today} {t('bookings.today') || 'today'}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons
                          name="calendar-week"
                          size={16}
                          color="#10b981"
                        />
                        <Text style={styles.statText}>
                          {stats.week} {t('bookings.thisWeek') || 'this week'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    {employee.is_active ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>
                          {t('employees.active') || 'Active'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>
                          {t('employees.inactive') || 'Inactive'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInitials: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  headerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  headerRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs / 2,
  },
  listHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  listTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  listSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs,
  },
  employeesList: {
    flex: 1,
  },
  employeesListContent: {
    padding: theme.spacing.md,
  },
  employeeCard: {
    marginBottom: theme.spacing.md,
  },
  employeeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  employeeAvatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitials: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  employeeRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs / 2,
  },
  employeeStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  statusBadge: {
    alignItems: 'flex-end',
  },
  activeBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  activeBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: `${theme.colors.placeholderLight}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  inactiveBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.placeholderLight,
  },
});

export default EmployeeBookingView;

