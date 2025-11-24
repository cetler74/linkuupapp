import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { billingAPI } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Logo from '../../components/common/Logo';

interface Plan {
  id: number;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  trial_days: number;
  features: Array<{
    feature: {
      code: string;
      name: string;
    };
    enabled: boolean;
    limit_value?: number;
  }>;
}

const BillingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { upgradePlan } = (route.params as any) || {};

  const [subscription, setSubscription] = useState<{ subscriptionId?: string; status?: string; planCode?: string } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (upgradePlan && plans.length > 0) {
      handleUpgrade(upgradePlan);
    }
  }, [upgradePlan, plans]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subscriptionData, plansData] = await Promise.all([
        billingAPI.getSubscription(),
        billingAPI.getPlans(),
      ]);
      setSubscription(subscriptionData);
      setPlans(plansData.plans || []);

      if (subscriptionData.planCode) {
        const plan = plansData.plans.find((p: Plan) => p.code === subscriptionData.planCode);
        setCurrentPlan(plan || null);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      Alert.alert(t('common.error') || 'Error', t('billing.fetchError') || 'Failed to load billing information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    try {
      setIsProcessing(true);
      const result = await billingAPI.changePlan(planCode);

      if (result.requiresPayment && result.checkoutUrl) {
        // Open Polar checkout
        const result = await WebBrowser.openBrowserAsync(result.checkoutUrl);
        
        if (result.type === 'dismiss') {
          // User closed the browser, verify the session
          // Extract session ID from URL if possible, or sync subscription
          await billingAPI.syncSubscription();
          await fetchData();
        }
      } else {
        // Plan changed without payment
        Alert.alert(
          t('billing.success') || 'Success',
          t('billing.planChanged') || 'Plan changed successfully'
        );
        await fetchData();
      }
    } catch (error: any) {
      console.error('Error changing plan:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.message || t('billing.changePlanError') || 'Failed to change plan'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCheckout = async (planCode: string) => {
    try {
      setIsProcessing(true);
      const result = await billingAPI.createCheckoutSession(planCode);
      
      const checkoutResult = await WebBrowser.openBrowserAsync(result.checkoutUrl);
      
      if (checkoutResult.type === 'dismiss') {
        // Try to verify if we can extract session ID
        // For now, just sync subscription
        await billingAPI.syncSubscription();
        await fetchData();
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.message || t('billing.checkoutError') || 'Failed to create checkout session'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsProcessing(true);
      const result = await billingAPI.getPortalLink();
      await Linking.openURL(result.url);
    } catch (error: any) {
      console.error('Error getting portal link:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.message || t('billing.portalError') || 'Failed to open billing portal'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getBillingPeriod = (planCode: string) => {
    if (planCode.includes('annual')) return t('billing.annual', { defaultValue: 'per year' });
    return t('billing.monthly', { defaultValue: 'per month' });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'trialing':
      case 'active':
        return '#10b981';
      case 'canceled':
      case 'expired':
        return theme.colors.secondary;
      default:
        return theme.colors.placeholderLight;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'trialing':
        return t('billing.status.trialing', { defaultValue: 'Trial' });
      case 'active':
        return t('billing.status.active', { defaultValue: 'Active' });
      case 'canceled':
        return t('billing.status.canceled', { defaultValue: 'Canceled' });
      case 'expired':
        return t('billing.status.expired', { defaultValue: 'Expired' });
      default:
        return t('billing.status.none', { defaultValue: 'No Subscription' });
    }
  };

  const getEmployeeLimit = (plan: Plan | null) => {
    if (!plan) return null;
    const employeeFeature = plan.features.find(f => f.feature.code === 'employees');
    return employeeFeature?.limit_value || null;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('billing.title', { defaultValue: 'Billing & Subscription' })}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('billing.title', { defaultValue: 'Billing & Subscription' })}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Subscription Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {t('billing.currentSubscription', { defaultValue: 'Current Subscription' })}
            </Text>
            {subscription?.status && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(subscription.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(subscription.status) }]}>
                  {getStatusLabel(subscription.status)}
                </Text>
              </View>
            )}
          </View>

          {currentPlan ? (
            <>
              <Text style={styles.planName}>{currentPlan.name}</Text>
              <Text style={styles.planPrice}>
                {formatPrice(currentPlan.price_cents, currentPlan.currency)} {getBillingPeriod(currentPlan.code)}
              </Text>
              {subscription?.status === 'trialing' && (
                <Text style={styles.trialInfo}>
                  {t('billing.trialActive', { defaultValue: 'Trial period active' })}
                </Text>
              )}
              {getEmployeeLimit(currentPlan) && (
                <Text style={styles.limitInfo}>
                  {t('billing.employeeLimit', {
                    limit: getEmployeeLimit(currentPlan),
                    defaultValue: `Employee limit: ${getEmployeeLimit(currentPlan)}`,
                  })}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.noPlan}>
              {t('billing.noSubscription', { defaultValue: 'No active subscription' })}
            </Text>
          )}
        </Card>

        {/* Available Plans */}
        <Text style={styles.sectionTitle}>
          {t('billing.availablePlans', { defaultValue: 'Available Plans' })}
        </Text>

        {plans.map((plan) => {
          const isCurrentPlan = plan.code === subscription?.planCode;
          const isBasic = plan.code.includes('basic');
          const isPro = plan.code.includes('pro');

          return (
            <Card key={plan.id} style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}>
              <View style={styles.planCardHeader}>
                <View>
                  <Text style={styles.planCardName}>{plan.name}</Text>
                  <Text style={styles.planCardPrice}>
                    {formatPrice(plan.price_cents, plan.currency)} {getBillingPeriod(plan.code)}
                  </Text>
                </View>
                {isCurrentPlan && (
                  <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
                )}
              </View>

              {plan.trial_days > 0 && (
                <View style={styles.trialBadge}>
                  <Text style={styles.trialBadgeText}>
                    {t('billing.trialDays', { days: plan.trial_days, defaultValue: `${plan.trial_days}-day trial` })}
                  </Text>
                </View>
              )}

              {getEmployeeLimit(plan) && (
                <Text style={styles.planLimit}>
                  {t('billing.upToEmployees', {
                    count: getEmployeeLimit(plan),
                    defaultValue: `Up to ${getEmployeeLimit(plan)} employees`,
                  })}
                </Text>
              )}

              {!isCurrentPlan && (
                <Button
                  title={
                    isPro && isBasic
                      ? t('billing.upgrade', { defaultValue: 'Upgrade' })
                      : t('billing.select', { defaultValue: 'Select Plan' })
                  }
                  onPress={() => {
                    if (plan.trial_days > 0) {
                      handleUpgrade(plan.code);
                    } else {
                      handleCreateCheckout(plan.code);
                    }
                  }}
                  disabled={isProcessing}
                  style={styles.planButton}
                />
              )}
            </Card>
          );
        })}

        {/* Manage Subscription */}
        {subscription?.status === 'active' && (
          <Card style={styles.card}>
            <Button
              title={t('billing.manageSubscription', { defaultValue: 'Manage Subscription' })}
              onPress={handleManageSubscription}
              variant="outline"
              disabled={isProcessing}
            />
          </Card>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  placeholder: {
    width: 32,
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
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as '500',
  },
  planName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  trialInfo: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginTop: 4,
  },
  limitInfo: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: 4,
  },
  noPlan: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  planCard: {
    marginBottom: theme.spacing.md,
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  planCardName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
  },
  planCardPrice: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  trialBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  trialBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium as '500',
  },
  planLimit: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.md,
  },
  planButton: {
    marginTop: theme.spacing.sm,
  },
});

export default BillingScreen;

