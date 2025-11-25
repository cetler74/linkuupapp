import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';

export type FilterType = 'all' | 'pending' | 'today' | 'week' | 'employee';

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedEmployeeId?: number | null;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  selectedEmployeeId,
}) => {
  const { t } = useTranslation();

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: t('bookings.filters.all') || 'All', icon: 'view-grid' },
    { key: 'pending', label: t('bookings.filters.pending') || 'Pending', icon: 'clock-alert-outline' },
    { key: 'today', label: t('bookings.filters.today') || 'Today', icon: 'calendar-today' },
    { key: 'week', label: t('bookings.filters.thisWeek') || 'This Week', icon: 'calendar-week' },
  ];

  if (selectedEmployeeId) {
    filters.push({ key: 'employee', label: t('bookings.filters.employee') || 'Employee', icon: 'account' });
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.chip,
            activeFilter === filter.key && styles.chipActive,
          ]}
          onPress={() => onFilterChange(filter.key)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={filter.icon as any}
            size={16}
            color={activeFilter === filter.key ? '#FFFFFF' : theme.colors.textLight}
          />
          <Text
            style={[
              styles.chipText,
              activeFilter === filter.key && styles.chipTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 50,
  },
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.bold,
  },
});

export default FilterChips;
