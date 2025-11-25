import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface CompactStatsBarProps {
  todayCount: number;
  pendingCount: number;
  weekTotal: number;
  onStatPress?: (stat: 'today' | 'pending' | 'week') => void;
}

export const CompactStatsBar: React.FC<CompactStatsBarProps> = ({
  todayCount,
  pendingCount,
  weekTotal,
  onStatPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.statItem, styles.todayItem]}
        onPress={() => onStatPress?.('today')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.todayIcon]}>
          <MaterialCommunityIcons name="calendar-today" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{todayCount}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.statItem, styles.pendingItem]}
        onPress={() => onStatPress?.('pending')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.pendingIcon]}>
          <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.statItem, styles.weekItem]}
        onPress={() => onStatPress?.('week')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.weekIcon]}>
          <MaterialCommunityIcons name="calendar-week" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{weekTotal}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  todayItem: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  pendingItem: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  weekItem: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  todayIcon: {
    backgroundColor: theme.colors.primary,
  },
  pendingIcon: {
    backgroundColor: theme.colors.warning,
  },
  weekIcon: {
    backgroundColor: theme.colors.success,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default CompactStatsBar;
