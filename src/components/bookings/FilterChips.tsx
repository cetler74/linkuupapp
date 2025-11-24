import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('bookings.filters.all') || 'All' },
    { key: 'pending', label: t('bookings.filters.pending') || 'Pending' },
    { key: 'today', label: t('bookings.filters.today') || 'Today' },
    { key: 'week', label: t('bookings.filters.thisWeek') || 'This Week' },
  ];

  if (selectedEmployeeId) {
    filters.push({ key: 'employee', label: t('bookings.filters.employee') || 'Employee' });
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.textLight,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

export default FilterChips;

