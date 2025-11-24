import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';
import ToggleSwitch from '../ui/ToggleSwitch';
import Input from '../ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface WorkingHours {
  [day: string]: {
    is_open: boolean;
    start_time?: string;
    end_time?: string;
  };
}

interface WorkingHoursSelectorProps {
  value: WorkingHours;
  onChange: (hours: WorkingHours) => void;
}

const WorkingHoursSelector: React.FC<WorkingHoursSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const days = [
    { key: 'monday', label: t('common.monday') || 'Monday' },
    { key: 'tuesday', label: t('common.tuesday') || 'Tuesday' },
    { key: 'wednesday', label: t('common.wednesday') || 'Wednesday' },
    { key: 'thursday', label: t('common.thursday') || 'Thursday' },
    { key: 'friday', label: t('common.friday') || 'Friday' },
    { key: 'saturday', label: t('common.saturday') || 'Saturday' },
    { key: 'sunday', label: t('common.sunday') || 'Sunday' },
  ];

  const updateDay = (dayKey: string, updates: Partial<WorkingHours[string]>) => {
    const newValue = {
      ...value,
      [dayKey]: {
        ...value[dayKey],
        ...updates,
      },
    };
    onChange(newValue);
  };

  const toggleDay = (dayKey: string) => {
    const currentDay = value[dayKey] || { is_open: false };
    const newIsOpen = !currentDay.is_open;
    
    updateDay(dayKey, {
      is_open: newIsOpen,
      start_time: newIsOpen ? (currentDay.start_time || '09:00') : undefined,
      end_time: newIsOpen ? (currentDay.end_time || '18:00') : undefined,
    });
  };

  const formatTime = (time: string | undefined): string => {
    if (!time) return '';
    // Ensure format is HH:MM
    if (time.length === 5 && time.includes(':')) {
      return time;
    }
    // If format is HHMM, convert to HH:MM
    if (time.length === 4) {
      return `${time.slice(0, 2)}:${time.slice(2)}`;
    }
    return time;
  };

  const handleTimeChange = (dayKey: string, field: 'start_time' | 'end_time', text: string) => {
    // Remove non-numeric characters except colon
    const cleaned = text.replace(/[^0-9:]/g, '');
    
    // Auto-format as user types
    let formatted = cleaned;
    if (cleaned.length === 2 && !cleaned.includes(':')) {
      formatted = `${cleaned}:`;
    } else if (cleaned.length === 4 && !cleaned.includes(':')) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
    
    // Validate format HH:MM
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (formatted.length === 5 && timeRegex.test(formatted)) {
      updateDay(dayKey, { [field]: formatted });
    } else if (formatted.length <= 5) {
      // Allow partial input while typing
      updateDay(dayKey, { [field]: formatted });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {t('employees.workingHours') || 'Working Hours'}
      </Text>
      
      {days.map((day) => {
        const dayData = value[day.key] || { is_open: false };
        const isOpen = dayData.is_open;

        return (
          <View key={day.key} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              <ToggleSwitch
                value={isOpen}
                onValueChange={() => toggleDay(day.key)}
              />
            </View>
            
            {isOpen && (
              <View style={styles.timeInputs}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>
                    {t('employees.startTime') || 'Start Time'}
                  </Text>
                  <Input
                    value={formatTime(dayData.start_time)}
                    onChangeText={(text) => handleTimeChange(day.key, 'start_time', text)}
                    placeholder="09:00"
                    keyboardType="numeric"
                    style={styles.timeInputField}
                  />
                </View>
                
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>
                    {t('employees.endTime') || 'End Time'}
                  </Text>
                  <Input
                    value={formatTime(dayData.end_time)}
                    onChangeText={(text) => handleTimeChange(day.key, 'end_time', text)}
                    placeholder="18:00"
                    keyboardType="numeric"
                    style={styles.timeInputField}
                  />
                </View>
              </View>
            )}
            
            {!isOpen && (
              <Text style={styles.closedText}>
                {t('common.closed') || 'Closed'}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  dayRow: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  dayLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  timeInputField: {
    marginBottom: 0,
  },
  closedText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
});

export default WorkingHoursSelector;

