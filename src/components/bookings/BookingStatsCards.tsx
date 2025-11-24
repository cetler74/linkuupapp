import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Card from '../ui/Card';

interface BookingStatsCardsProps {
  todayCount: number;
  pendingCount: number;
  weekTotal: number;
}

const BookingStatsCards: React.FC<BookingStatsCardsProps> = ({
  todayCount,
  pendingCount,
  weekTotal,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <MaterialCommunityIcons name="calendar-today" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{todayCount}</Text>
            <Text style={styles.statLabel}>
              {t('bookings.stats.today') || "Today's Bookings"}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={[styles.statCard, pendingCount > 0 && styles.pendingCard]}>
        <View style={styles.statContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#f59e0b" />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, pendingCount > 0 && styles.pendingValue]}>
              {pendingCount}
            </Text>
            <Text style={styles.statLabel}>
              {t('bookings.stats.pending') || 'Pending'}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#10b98120' }]}>
            <MaterialCommunityIcons name="calendar-week" size={24} color="#10b981" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{weekTotal}</Text>
            <Text style={styles.statLabel}>
              {t('bookings.stats.thisWeek') || 'This Week'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
  },
  pendingCard: {
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  pendingValue: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs / 2,
  },
});

export default BookingStatsCards;

