import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const PlanSelectionScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { onPlanSelected } = (route.params as any) || {};

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await billingAPI.getPlans();
      setPlans(response.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert(t('common.error') || 'Error', t('billing.fetchPlansError') || 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planCode: string) => {
    setSelectedPlan(planCode);
    if (onPlanSelected) {
      onPlanSelected(planCode);
    }
  };

  const handleContinue = () => {
    if (!selectedPlan) {
      Alert.alert(
        t('common.error') || 'Error',
        t('billing.selectPlanFirst', { defaultValue: 'Please select a plan first' })
      );
      return;
    }
    if (onPlanSelected) {
      onPlanSelected(selectedPlan);
    }
    navigation.goBack();
  };

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getBillingPeriod = (planCode: string) => {
    if (planCode.includes('annual')) return t('billing.perYear', { defaultValue: '/year' });
    return t('billing.perMonth', { defaultValue: '/month' });
  };

  const getEmployeeLimit = (plan: Plan) => {
    const employeeFeature = plan.features.find(f => f.feature.code === 'employees');
    return employeeFeature?.limit_value || null;
  };

  const basicPlans = plans.filter(p => p.code.includes('basic'));
  const proPlans = plans.filter(p => p.code.includes('pro'));

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('billing.selectPlan', { defaultValue: 'Select a Plan' })}
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
          {t('billing.selectPlan', { defaultValue: 'Select a Plan' })}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          {t('billing.choosePlan', { defaultValue: 'Choose the perfect plan for your business' })}
        </Text>

        {/* Basic Plans */}
        <Text style={styles.sectionTitle}>
          {t('pricing.basic', { defaultValue: 'Basic' })}
        </Text>
        {basicPlans.map((plan) => (
          <Card
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.code && styles.selectedPlanCard]}
          >
            <TouchableOpacity
              onPress={() => handlePlanSelect(plan.code)}
              activeOpacity={0.7}
            >
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {formatPrice(plan.price_cents, plan.currency)}{getBillingPeriod(plan.code)}
                  </Text>
                </View>
                {selectedPlan === plan.code && (
                  <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
                )}
              </View>

              {plan.trial_days > 0 && (
                <View style={styles.trialBadge}>
                  <MaterialCommunityIcons name="gift" size={16} color={theme.colors.primary} />
                  <Text style={styles.trialBadgeText}>
                    {t('billing.trialDays', {
                      days: plan.trial_days,
                      defaultValue: `${plan.trial_days}-day free trial`,
                    })}
                  </Text>
                </View>
              )}

              {getEmployeeLimit(plan) && (
                <Text style={styles.planFeature}>
                  {t('billing.upToEmployees', {
                    count: getEmployeeLimit(plan),
                    defaultValue: `Up to ${getEmployeeLimit(plan)} employees`,
                  })}
                </Text>
              )}
            </TouchableOpacity>
          </Card>
        ))}

        {/* Pro Plans */}
        <Text style={styles.sectionTitle}>
          {t('pricing.pro', { defaultValue: 'Pro' })}
        </Text>
        {proPlans.map((plan) => (
          <Card
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.code && styles.selectedPlanCard]}
          >
            <TouchableOpacity
              onPress={() => handlePlanSelect(plan.code)}
              activeOpacity={0.7}
            >
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>
                      {t('pricing.mostPopular', { defaultValue: 'Most Popular' })}
                    </Text>
                  </View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {formatPrice(plan.price_cents, plan.currency)}{getBillingPeriod(plan.code)}
                  </Text>
                </View>
                {selectedPlan === plan.code && (
                  <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
                )}
              </View>

              {plan.trial_days === 0 && (
                <View style={styles.paymentRequiredBadge}>
                  <MaterialCommunityIcons name="credit-card" size={16} color={theme.colors.secondary} />
                  <Text style={styles.paymentRequiredText}>
                    {t('billing.paymentRequired', { defaultValue: 'Payment required' })}
                  </Text>
                </View>
              )}

              {getEmployeeLimit(plan) && (
                <Text style={styles.planFeature}>
                  {t('billing.upToEmployees', {
                    count: getEmployeeLimit(plan),
                    defaultValue: `Up to ${getEmployeeLimit(plan)} employees`,
                  })}
                </Text>
              )}
            </TouchableOpacity>
          </Card>
        ))}

        <Button
          title={t('common.continue', { defaultValue: 'Continue' })}
          onPress={handleContinue}
          style={styles.continueButton}
        />
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
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  planCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  planInfo: {
    flex: 1,
  },
  proBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  proBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.bold as '700',
  },
  planName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textLight,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
  },
  paymentRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  paymentRequiredText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.secondary,
    fontWeight: theme.typography.fontWeight.medium as '500',
    marginLeft: 4,
  },
  planFeature: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  continueButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});

export default PlanSelectionScreen;

