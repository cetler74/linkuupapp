import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';

interface CompactStatsBarProps {
  todayCount: number;
  pendingCount: number;
  weekTotal: number;
  onTodayPress?: () => void;
  onPendingPress?: () => void;
  onWeekPress?: () => void;
}

const CompactStatsBar: React.FC<CompactStatsBarProps> = ({
  todayCount,
  pendingCount,
  weekTotal,
  onTodayPress,
  onPendingPress,
  onWeekPress,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.statItem}
        onPress={onTodayPress}
        activeOpacity={0.7}
      >
        <Text style={styles.statLabel}>{t('bookings.stats.today') || "Today"}</Text>
        <Text style={styles.statValue}>{todayCount}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.statItem, pendingCount > 0 && styles.pendingItem]}
        onPress={onPendingPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.statLabel, pendingCount > 0 && styles.pendingLabel]}>
          {t('bookings.stats.pending') || 'Pending'}
        </Text>
        <Text style={[styles.statValue, pendingCount > 0 && styles.pendingValue]}>
          {pendingCount}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.statItem}
        onPress={onWeekPress}
        activeOpacity={0.7}
      >
        <Text style={styles.statLabel}>{t('bookings.stats.thisWeek') || 'Week'}</Text>
        <Text style={styles.statValue}>{weekTotal}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    minHeight: 60,
    justifyContent: 'center',
  },
  pendingItem: {
    backgroundColor: '#f59e0b10',
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs / 2,
  },
  pendingLabel: {
    color: '#f59e0b',
    fontWeight: theme.typography.fontWeight.medium as '500',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  pendingValue: {
    color: '#f59e0b',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: theme.spacing.xs,
  },
});

export default CompactStatsBar;

