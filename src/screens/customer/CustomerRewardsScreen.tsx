import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { customerAPI } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Logo from '../../components/common/Logo';

interface Reward {
  id: number;
  name: string;
  description: string;
  points_required: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_available: boolean;
}

const CustomerRewardsScreen = () => {
  const { t } = useTranslation();
  const [points, setPoints] = useState(1250);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRewards();
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      // Fetch user points from API
      // const response = await customerAPI.getPoints();
      // setPoints(response.points);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      // Fetch available rewards from API
      // const response = await customerAPI.getRewards();
      // setRewards(response);
      
      // Mock data for now
      setRewards([
        {
          id: 1,
          name: '10% Off Next Booking',
          description: 'Get 10% discount on your next appointment',
          points_required: 500,
          discount_type: 'percentage',
          discount_value: 10,
          is_available: true,
        },
        {
          id: 2,
          name: 'Free Service',
          description: 'Redeem a free service of your choice',
          points_required: 1000,
          discount_type: 'fixed',
          discount_value: 0,
          is_available: true,
        },
        {
          id: 3,
          name: '20% Off Premium Services',
          description: '20% discount on premium services',
          points_required: 1500,
          discount_type: 'percentage',
          discount_value: 20,
          is_available: true,
        },
      ]);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRewards();
    fetchPoints();
  };

  const handleRedeem = async (rewardId: number) => {
    try {
      // await customerAPI.redeemReward(rewardId);
      alert(t('rewards.redeemed') || 'Reward redeemed successfully!');
      fetchPoints();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert(t('rewards.redeemError') || 'Error redeeming reward');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('nav.rewards') || 'Rewards'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Points Card */}
        <View style={styles.pointsCard}>
        <View style={styles.pointsContent}>
          <Text style={styles.pointsIcon}>🏆</Text>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>
              {t('rewards.yourPoints') || 'Your Points'}
            </Text>
            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsDescription}>
              {t('rewards.redeemForDiscounts') || 'Redeem for discounts & free services'}
            </Text>
          </View>
        </View>
      </View>

      {/* Rewards Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('rewards.availableRewards') || 'Available Rewards'}
        </Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : rewards.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('rewards.noRewardsAvailable') || 'No rewards available at the moment'}
            </Text>
          </Card>
        ) : (
          rewards.map((reward) => {
            const canRedeem = points >= reward.points_required && reward.is_available;
            
            return (
              <Card key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardHeader}>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>{reward.points_required} pts</Text>
                  </View>
                </View>
                <View style={styles.rewardFooter}>
                  {canRedeem ? (
                    <Button
                      title={t('rewards.redeem') || 'Redeem'}
                      onPress={() => handleRedeem(reward.id)}
                      variant="primary"
                      size="md"
                      style={styles.redeemButton}
                    />
                  ) : (
                    <View style={styles.insufficientPoints}>
                      <Text style={styles.insufficientPointsText}>
                        {points < reward.points_required
                          ? t('rewards.needMorePoints', { 
                              points: reward.points_required - points 
                            }) || `Need ${reward.points_required - points} more points`
                          : t('rewards.unavailable') || 'Unavailable'}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('rewards.howItWorks') || 'How It Works'}
        </Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>1️⃣</Text>
            <Text style={styles.infoText}>
              {t('rewards.step1') || 'Book and complete appointments to earn points'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>2️⃣</Text>
            <Text style={styles.infoText}>
              {t('rewards.step2') || 'Accumulate points with each booking'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>3️⃣</Text>
            <Text style={styles.infoText}>
              {t('rewards.step3') || 'Redeem points for discounts and free services'}
            </Text>
          </View>
        </Card>
      </View>
      </ScrollView>
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
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  pointsCard: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsIcon: {
    fontSize: 48,
    marginRight: theme.spacing.md,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: theme.typography.fontSize.base,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  pointsValue: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  pointsDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  rewardCard: {
    marginBottom: theme.spacing.md,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  rewardInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  rewardName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  rewardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  pointsBadge: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  pointsBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  rewardFooter: {
    marginTop: theme.spacing.sm,
  },
  redeemButton: {
    width: '100%',
  },
  insufficientPoints: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  insufficientPointsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
  infoCard: {
    padding: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  infoIcon: {
    fontSize: theme.typography.fontSize.xl,
    marginRight: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    lineHeight: 24,
  },
});

export default CustomerRewardsScreen;
