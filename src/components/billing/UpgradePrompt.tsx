import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../ui/Button';

interface UpgradePromptProps {
  currentPlan: string;
  limitType: 'employees' | 'services' | 'campaigns' | string;
  currentCount: number;
  limitValue: number;
  onDismiss?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  currentPlan,
  limitType,
  currentCount,
  limitValue,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    navigation.navigate('Billing' as never, { upgradePlan: 'pro_month' } as never);
    handleDismiss();
  };

  if (dismissed) return null;

  const getLimitMessage = () => {
    if (limitType === 'employees') {
      return t('billing.upgradePrompt.employeeLimit', {
        current: currentCount,
        limit: limitValue,
        defaultValue: `You've reached your employee limit (${currentCount}/${limitValue}). Upgrade to Pro to add more employees.`,
      });
    }
    return t('billing.upgradePrompt.limitReached', {
      type: limitType,
      current: currentCount,
      limit: limitValue,
      defaultValue: `You've reached your ${limitType} limit (${currentCount}/${limitValue}).`,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.secondary} />
          <Text style={styles.title}>
            {t('billing.upgradePrompt.title', { defaultValue: 'Limit Reached' })}
          </Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>{getLimitMessage()}</Text>

        <View style={styles.comparison}>
          <View style={styles.planCard}>
            <Text style={styles.planName}>
              {t('pricing.basic', { defaultValue: 'Basic' })}
            </Text>
            <Text style={styles.planLimit}>
              {limitType === 'employees' ? '2' : limitValue} {limitType}
            </Text>
          </View>

          <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.primary} style={styles.arrow} />

          <View style={[styles.planCard, styles.proCard]}>
            <Text style={styles.planName}>
              {t('pricing.pro', { defaultValue: 'Pro' })}
            </Text>
            <Text style={styles.planLimit}>
              {limitType === 'employees' ? '5' : 'Unlimited'} {limitType}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('billing.upgradePrompt.upgradeButton', { defaultValue: 'Upgrade to Pro' })}
            onPress={handleUpgrade}
            style={styles.upgradeButton}
          />
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>
              {t('common.later', { defaultValue: 'Maybe Later' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    marginBottom: 16,
  },
  content: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textLight,
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  comparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 12,
  },
  planCard: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  proCard: {
    backgroundColor: theme.colors.primary + '15',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  planLimit: {
    fontSize: 12,
    color: theme.colors.placeholderLight,
  },
  arrow: {
    marginHorizontal: 12,
  },
  actions: {
    gap: 12,
  },
  upgradeButton: {
    marginBottom: 0,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
    color: theme.colors.placeholderLight,
  },
});

export default UpgradePrompt;

