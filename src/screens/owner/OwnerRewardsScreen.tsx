import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RewardsConfig {
  calculation_method: 'volume_based' | 'fixed_per_booking';
  points_per_booking?: number;
  points_per_currency_unit?: number;
  is_active: boolean;
  redemption_rules: {
    min_points_redemption: number;
    max_points_redemption: number;
    points_to_currency_ratio: number;
  };
}

const OwnerRewardsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId: routePlaceId } = (route.params as any) || {};

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(routePlaceId || null);
  const [config, setConfig] = useState<RewardsConfig>({
    calculation_method: 'volume_based',
    points_per_booking: 10,
    points_per_currency_unit: 1,
    is_active: true,
    redemption_rules: {
      min_points_redemption: 100,
      max_points_redemption: 1000,
      points_to_currency_ratio: 10,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchRewardSettings();
    }
  }, [selectedPlaceId]);

  const fetchPlaces = async () => {
    try {
      const response = await ownerAPI.getOwnerPlaces();
      const placesList = Array.isArray(response) ? response : [];
      setPlaces(placesList);
      if (placesList.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(placesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    }
  };

  const fetchRewardSettings = async () => {
    if (!selectedPlaceId) return;
    try {
      setIsLoading(true);
      const response = await ownerAPI.getRewardSettings(selectedPlaceId);
      if (response) {
        setConfig({
          calculation_method: response.calculation_method || 'volume_based',
          points_per_booking: response.points_per_booking || 10,
          points_per_currency_unit: response.points_per_currency_unit || 1,
          is_active: response.is_active !== false,
          redemption_rules: response.redemption_rules || {
            min_points_redemption: 100,
            max_points_redemption: 1000,
            points_to_currency_ratio: 10,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching reward settings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPlaceId) {
      Alert.alert(t('common.error') || 'Error', t('rewards.selectPlaceFirst') || 'Please select a place first');
      return;
    }
    setSaving(true);
    try {
      await ownerAPI.updateRewardSettings(selectedPlaceId, config);
      Alert.alert(t('common.success') || 'Success', t('rewards.settingsSaved') || 'Rewards settings saved successfully!');
      setShowConfigModal(false);
    } catch (error: any) {
      console.error('Error saving reward settings:', error);
      Alert.alert(t('common.error') || 'Error', error.message || (t('rewards.saveError') || 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlaces();
    if (selectedPlaceId) {
      fetchRewardSettings();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('rewards.title') || 'Rewards Management'}
        </Text>
      </View>

      {/* Place Selector */}
      {places.length > 1 && (
        <View style={styles.placeSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.placeSelectorContent}
          >
            {places.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.placeChip,
                  selectedPlaceId === p.id && styles.placeChipActive,
                ]}
                onPress={() => setSelectedPlaceId(p.id)}
              >
                <Text
                  style={[
                    styles.placeChipText,
                    selectedPlaceId === p.id && styles.placeChipTextActive,
                  ]}
                >
                  {p.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Rewards Overview */}
          <Card style={styles.overviewCard}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="gift" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.overviewTitle}>
              {t('rewards.rewardsSystem') || 'Rewards System'}
            </Text>
            <Text style={styles.overviewDescription}>
              {t('rewards.description') || 'Set up customer loyalty programs, points systems, and reward redemption rules.'}
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.featureText}>
                  {t('rewards.pointsPerBooking') || 'Points per booking'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.featureText}>
                  {t('rewards.tierBasedRewards') || 'Tier-based rewards'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.featureText}>
                  {t('rewards.redemptionTracking') || 'Redemption tracking'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.featureText}>
                  {t('rewards.customerAnalytics') || 'Customer analytics'}
                </Text>
              </View>
            </View>

            <Button
              title={t('rewards.configureRewards') || 'Configure Rewards'}
              onPress={() => setShowConfigModal(true)}
              variant="primary"
              style={styles.configButton}
            />
          </Card>

          {/* Current Settings Summary */}
          <Card style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>
              {t('rewards.currentSettings') || 'Current Settings'}
            </Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>
                {t('rewards.status') || 'Status'}
              </Text>
              <View style={[styles.statusBadge, config.is_active ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>
                  {config.is_active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                </Text>
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>
                {t('rewards.calculationMethod') || 'Calculation Method'}
              </Text>
              <Text style={styles.settingValue}>
                {config.calculation_method === 'volume_based'
                  ? (t('rewards.volumeBased') || 'Volume Based')
                  : (t('rewards.fixedPerBooking') || 'Fixed per Booking')}
              </Text>
            </View>
            {config.calculation_method === 'fixed_per_booking' && (
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>
                  {t('rewards.pointsPerBooking') || 'Points per Booking'}
                </Text>
                <Text style={styles.settingValue}>{config.points_per_booking}</Text>
              </View>
            )}
            {config.calculation_method === 'volume_based' && (
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>
                  {t('rewards.pointsPerCurrency') || 'Points per Currency Unit'}
                </Text>
                <Text style={styles.settingValue}>{config.points_per_currency_unit}</Text>
              </View>
            )}
          </Card>
        </ScrollView>
      )}

      {/* Configuration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConfigModal}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('rewards.configureRewards') || 'Configure Rewards'}
              </Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  {t('rewards.generalSettings') || 'General Settings'}
                </Text>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {t('rewards.enableRewards') || 'Enable Rewards System'}
                  </Text>
                  <ToggleSwitch
                    value={config.is_active}
                    onValueChange={(value) => setConfig({ ...config, is_active: value })}
                  />
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  {t('rewards.calculationMethod') || 'Calculation Method'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    config.calculation_method === 'volume_based' && styles.optionButtonActive,
                  ]}
                  onPress={() => setConfig({ ...config, calculation_method: 'volume_based' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      config.calculation_method === 'volume_based' && styles.optionTextActive,
                    ]}
                  >
                    {t('rewards.volumeBased') || 'Volume Based (Points per Euro)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    config.calculation_method === 'fixed_per_booking' && styles.optionButtonActive,
                  ]}
                  onPress={() => setConfig({ ...config, calculation_method: 'fixed_per_booking' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      config.calculation_method === 'fixed_per_booking' && styles.optionTextActive,
                    ]}
                  >
                    {t('rewards.fixedPerBooking') || 'Fixed per Booking'}
                  </Text>
                </TouchableOpacity>
              </View>

              {config.calculation_method === 'fixed_per_booking' && (
                <View style={styles.modalSection}>
                  <Input
                    label={t('rewards.pointsPerBooking') || 'Points per Booking'}
                    value={config.points_per_booking?.toString() || '10'}
                    onChangeText={(text) =>
                      setConfig({ ...config, points_per_booking: parseInt(text) || 10 })
                    }
                    keyboardType="numeric"
                  />
                </View>
              )}

              {config.calculation_method === 'volume_based' && (
                <View style={styles.modalSection}>
                  <Input
                    label={t('rewards.pointsPerCurrency') || 'Points per Currency Unit'}
                    value={config.points_per_currency_unit?.toString() || '1'}
                    onChangeText={(text) =>
                      setConfig({ ...config, points_per_currency_unit: parseFloat(text) || 1 })
                    }
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  {t('rewards.redemptionRules') || 'Redemption Rules'}
                </Text>
                <Input
                  label={t('rewards.minPointsRedemption') || 'Minimum Points for Redemption'}
                  value={config.redemption_rules.min_points_redemption.toString()}
                  onChangeText={(text) =>
                    setConfig({
                      ...config,
                      redemption_rules: {
                        ...config.redemption_rules,
                        min_points_redemption: parseInt(text) || 100,
                      },
                    })
                  }
                  keyboardType="numeric"
                />
                <Input
                  label={t('rewards.maxPointsRedemption') || 'Maximum Points for Redemption'}
                  value={config.redemption_rules.max_points_redemption.toString()}
                  onChangeText={(text) =>
                    setConfig({
                      ...config,
                      redemption_rules: {
                        ...config.redemption_rules,
                        max_points_redemption: parseInt(text) || 1000,
                      },
                    })
                  }
                  keyboardType="numeric"
                />
                <Input
                  label={t('rewards.pointsToCurrencyRatio') || 'Points to Currency Ratio'}
                  value={config.redemption_rules.points_to_currency_ratio.toString()}
                  onChangeText={(text) =>
                    setConfig({
                      ...config,
                      redemption_rules: {
                        ...config.redemption_rules,
                        points_to_currency_ratio: parseInt(text) || 10,
                      },
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel') || 'Cancel'}
                onPress={() => setShowConfigModal(false)}
                variant="secondary"
                style={styles.modalButton}
                disabled={saving}
              />
              <Button
                title={saving ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
                onPress={handleSave}
                variant="primary"
                style={styles.modalButton}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  placeSelectorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  placeSelectorContent: {
    gap: theme.spacing.sm,
  },
  placeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  placeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  placeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  placeChipTextActive: {
    color: '#FFFFFF',
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
  overviewCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  overviewTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  overviewDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  featuresList: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.sm,
  },
  configButton: {
    width: '100%',
    maxWidth: 300,
  },
  settingsCard: {
    padding: theme.spacing.md,
  },
  settingsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  settingValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusActive: {
    backgroundColor: '#10b98120',
  },
  statusInactive: {
    backgroundColor: theme.colors.borderLight,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  modalScrollView: {
    maxHeight: 500,
    padding: theme.spacing.md,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalSectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    flex: 1,
  },
  optionButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.sm,
  },
  optionButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  optionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});

export default OwnerRewardsScreen;
