import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';

export type ViewMode = 'list' | 'month' | 'week' | 'day' | 'team';

interface ViewModeTabsProps {
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const ViewModeTabs: React.FC<ViewModeTabsProps> = ({ activeMode, onModeChange }) => {
  const { t } = useTranslation();

  const modes: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'list', label: t('bookings.viewModes.list') || 'List', icon: 'format-list-bulleted' },
    { key: 'month', label: t('bookings.viewModes.month') || 'Month', icon: 'calendar-month' },
    { key: 'week', label: t('bookings.viewModes.week') || 'Week', icon: 'calendar-week' },
    { key: 'day', label: t('bookings.viewModes.day') || 'Day', icon: 'calendar-today' },
    { key: 'team', label: t('bookings.viewModes.team') || 'Team', icon: 'account-group' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[styles.tab, activeMode === mode.key && styles.tabActive]}
            onPress={() => onModeChange(mode.key)}
          >
            <Text style={[styles.tabText, activeMode === mode.key && styles.tabTextActive]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.placeholderLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold as '700',
  },
});

export default ViewModeTabs;

