import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import { ownerAPI, Place, PlaceEmployee } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TimeOff {
  id: number;
  employee_id: number;
  employee_name: string;
  time_off_type: 'holiday' | 'sick_leave' | 'personal_day' | 'vacation';
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
}

const TimeOffScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId: routePlaceId } = (route.params as any) || {};

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(routePlaceId || null);
  const [employees, setEmployees] = useState<PlaceEmployee[]>([]);
  const [timeOffList, setTimeOffList] = useState<TimeOff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    employee_id: 0,
    time_off_type: 'holiday' as TimeOff['time_off_type'],
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchEmployees();
      fetchTimeOff();
    }
  }, [selectedPlaceId, selectedDate, viewMode]);

  const fetchPlaces = async () => {
    try {
      const response = await ownerAPI.getOwnerPlaces();
      const placesList = Array.isArray(response) ? response : [];
      setPlaces(placesList);
      if (placesList.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(placesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    }
  };

  const fetchEmployees = async () => {
    if (!selectedPlaceId) return;
    try {
      const response = await ownerAPI.getPlaceEmployees(selectedPlaceId);
      setEmployees(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchTimeOff = async () => {
    if (!selectedPlaceId) return;
    try {
      setIsLoading(true);
      const startDate = new Date(selectedDate);
      startDate.setDate(1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const response = await ownerAPI.getPlaceTimeOffCalendar(
        selectedPlaceId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setTimeOffList(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching time off:', error);
      setTimeOffList([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTimeOff();
  };

  const handleAdd = () => {
    setFormData({
      employee_id: employees.length > 0 ? employees[0].id : 0,
      time_off_type: 'holiday',
      start_date: '',
      end_date: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      Alert.alert(t('common.error') || 'Error', t('timeOff.fillAllFields') || 'Please fill all required fields.');
      return;
    }
    if (!selectedPlaceId) {
      Alert.alert(t('common.error') || 'Error', t('timeOff.selectPlaceFirst') || 'Please select a place first');
      return;
    }
    setSubmitting(true);
    try {
      await ownerAPI.createTimeOff(selectedPlaceId, formData.employee_id, {
        time_off_type: formData.time_off_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes || undefined,
      });
      setShowModal(false);
      fetchTimeOff();
    } catch (error: any) {
      console.error('Error saving time off:', error);
      Alert.alert(t('common.error') || 'Error', error.message || (t('timeOff.saveError') || 'Failed to save time off.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (timeOffId: number) => {
    try {
      await ownerAPI.approveTimeOff(timeOffId);
      Alert.alert(t('common.success') || 'Success', t('timeOff.approved') || 'Time off approved!');
      fetchTimeOff();
    } catch (error) {
      console.error('Error approving time off:', error);
      Alert.alert(t('common.error') || 'Error', t('timeOff.approveError') || 'Failed to approve time off.');
    }
  };

  const handleDelete = async (timeOffId: number) => {
    Alert.alert(
      t('common.delete') || 'Delete',
      t('timeOff.confirmDelete') || 'Are you sure you want to delete this time off request?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerAPI.deleteTimeOff(timeOffId);
              Alert.alert(t('common.success') || 'Success', t('timeOff.deleteSuccess') || 'Time off deleted successfully!');
              fetchTimeOff();
            } catch (error) {
              console.error('Error deleting time off:', error);
              Alert.alert(t('common.error') || 'Error', t('timeOff.deleteError') || 'Failed to delete time off.');
            }
          },
        },
      ]
    );
  };

  const getTimeOffTypeColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return '#10b981';
      case 'sick_leave':
        return theme.colors.secondary;
      case 'personal_day':
        return theme.colors.primary;
      case 'vacation':
        return '#8b5cf6';
      default:
        return theme.colors.placeholderLight;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return theme.colors.secondary;
      case 'cancelled':
        return theme.colors.placeholderLight;
      default:
        return theme.colors.placeholderLight;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const markedDates: any = {};
  timeOffList.forEach((timeOff) => {
    const start = new Date(timeOff.start_date);
    const end = new Date(timeOff.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!markedDates[dateStr]) {
        markedDates[dateStr] = { marked: true, dotColor: getTimeOffTypeColor(timeOff.time_off_type) };
      }
    }
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('timeOff.title') || 'Time Off Management'}
        </Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Place Selector */}
      {places.length > 1 && (
        <View style={styles.placeSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.placeSelectorContent}
          >
            {places.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.placeChip,
                  selectedPlaceId === p.id && styles.placeChipActive,
                ]}
                onPress={() => setSelectedPlaceId(p.id)}
              >
                <Text
                  style={[
                    styles.placeChipText,
                    selectedPlaceId === p.id && styles.placeChipTextActive,
                  ]}
                >
                  {p.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            {t('timeOff.list') || 'List'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>
            {t('timeOff.calendar') || 'Calendar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : viewMode === 'calendar' ? (
        <ScrollView style={styles.scrollView}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...markedDates,
              [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: theme.colors.primary },
            }}
            theme={{
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
            }}
            style={styles.calendar}
          />
          <View style={styles.scrollContent}>
            {timeOffList
              .filter((to) => {
                const date = new Date(selectedDate);
                const start = new Date(to.start_date);
                const end = new Date(to.end_date);
                return date >= start && date <= end;
              })
              .map((timeOff) => (
                <Card key={timeOff.id} style={styles.timeOffCard}>
                  <View style={styles.timeOffHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: getTimeOffTypeColor(timeOff.time_off_type) + '20' }]}>
                      <Text style={[styles.typeText, { color: getTimeOffTypeColor(timeOff.time_off_type) }]}>
                        {timeOff.time_off_type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(timeOff.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(timeOff.status) }]}>
                        {timeOff.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.employeeName}>{timeOff.employee_name}</Text>
                  <Text style={styles.dateRange}>
                    {formatDate(timeOff.start_date)} - {formatDate(timeOff.end_date)}
                  </Text>
                  {timeOff.notes && <Text style={styles.notes}>{timeOff.notes}</Text>}
                  {timeOff.status === 'pending' && (
                    <View style={styles.actions}>
                      <Button
                        title={t('timeOff.approve') || 'Approve'}
                        onPress={() => handleApprove(timeOff.id)}
                        variant="primary"
                        size="sm"
                        style={styles.actionButton}
                      />
                      <Button
                        title={t('common.delete') || 'Delete'}
                        onPress={() => handleDelete(timeOff.id)}
                        variant="secondary"
                        size="sm"
                        style={styles.actionButton}
                      />
                    </View>
                  )}
                </Card>
              ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {timeOffList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="calendar-clock-outline"
                size={64}
                color={theme.colors.placeholderLight}
              />
              <Text style={styles.emptyText}>
                {t('timeOff.noTimeOff') || 'No time off requests found.'}
              </Text>
            </View>
          ) : (
            timeOffList.map((timeOff) => (
              <Card key={timeOff.id} style={styles.timeOffCard}>
                <View style={styles.timeOffHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: getTimeOffTypeColor(timeOff.time_off_type) + '20' }]}>
                    <Text style={[styles.typeText, { color: getTimeOffTypeColor(timeOff.time_off_type) }]}>
                      {timeOff.time_off_type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(timeOff.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(timeOff.status) }]}>
                      {timeOff.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.employeeName}>{timeOff.employee_name}</Text>
                <Text style={styles.dateRange}>
                  {formatDate(timeOff.start_date)} - {formatDate(timeOff.end_date)}
                </Text>
                {timeOff.notes && <Text style={styles.notes}>{timeOff.notes}</Text>}
                {timeOff.status === 'pending' && (
                  <View style={styles.actions}>
                    <Button
                      title={t('timeOff.approve') || 'Approve'}
                      onPress={() => handleApprove(timeOff.id)}
                      variant="primary"
                      size="sm"
                      style={styles.actionButton}
                    />
                    <Button
                      title={t('common.delete') || 'Delete'}
                      onPress={() => handleDelete(timeOff.id)}
                      variant="secondary"
                      size="sm"
                      style={styles.actionButton}
                    />
                  </View>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Time Off Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('timeOff.addTimeOff') || 'Add Time Off'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  {t('timeOff.employee') || 'Employee'}
                </Text>
                {employees.map((emp) => (
                  <TouchableOpacity
                    key={emp.id}
                    style={[
                      styles.optionButton,
                      formData.employee_id === emp.id && styles.optionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, employee_id: emp.id })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.employee_id === emp.id && styles.optionTextActive,
                      ]}
                    >
                      {emp.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  {t('timeOff.type') || 'Type'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.time_off_type === 'holiday' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, time_off_type: 'holiday' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.time_off_type === 'holiday' && styles.optionTextActive,
                    ]}
                  >
                    {t('timeOff.holiday') || 'Holiday'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.time_off_type === 'sick_leave' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, time_off_type: 'sick_leave' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.time_off_type === 'sick_leave' && styles.optionTextActive,
                    ]}
                  >
                    {t('timeOff.sickLeave') || 'Sick Leave'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.time_off_type === 'personal_day' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, time_off_type: 'personal_day' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.time_off_type === 'personal_day' && styles.optionTextActive,
                    ]}
                  >
                    {t('timeOff.personalDay') || 'Personal Day'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.time_off_type === 'vacation' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, time_off_type: 'vacation' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.time_off_type === 'vacation' && styles.optionTextActive,
                    ]}
                  >
                    {t('timeOff.vacation') || 'Vacation'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label={t('timeOff.startDate') || 'Start Date'}
                placeholder="YYYY-MM-DD"
                value={formData.start_date}
                onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                style={styles.input}
              />
              <Input
                label={t('timeOff.endDate') || 'End Date'}
                placeholder="YYYY-MM-DD"
                value={formData.end_date}
                onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                style={styles.input}
              />
              <Input
                label={t('timeOff.notes') || 'Notes (Optional)'}
                placeholder={t('timeOff.notesPlaceholder') || 'Enter notes...'}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel') || 'Cancel'}
                onPress={() => setShowModal(false)}
                variant="secondary"
                style={styles.modalButton}
                disabled={submitting}
              />
              <Button
                title={submitting ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
                onPress={handleSave}
                variant="primary"
                style={styles.modalButton}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  placeSelectorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  placeSelectorContent: {
    gap: theme.spacing.sm,
  },
  placeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  placeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  placeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  placeChipTextActive: {
    color: '#FFFFFF',
  },
  viewToggle: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  calendar: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  timeOffCard: {
    marginBottom: theme.spacing.md,
  },
  timeOffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  typeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  employeeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  dateRange: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  notes: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  modalScrollView: {
    maxHeight: 500,
    padding: theme.spacing.md,
  },
  modalSection: {
    marginBottom: theme.spacing.md,
  },
  modalSectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  optionButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.sm,
  },
  optionButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  optionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});

export default TimeOffScreen;
