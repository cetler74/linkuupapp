import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, Dimensions, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

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
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching reward settings:', error);
      }
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('rewards.title') || 'Rewards'}
          </Text>
        </View>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={[theme.colors.primary]}
            />
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
                <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
                <Text style={styles.featureText}>
                  {t('rewards.pointsPerBooking') || 'Points per booking'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
                <Text style={styles.featureText}>
                  {t('rewards.tierBasedRewards') || 'Tier-based rewards'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
                <Text style={styles.featureText}>
                  {t('rewards.redemptionTracking') || 'Redemption tracking'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
                <Text style={styles.featureText}>
                  {t('rewards.customerAnalytics') || 'Customer analytics'}
                </Text>
              </View>
            </View>

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
                <Text style={[styles.statusText, config.is_active ? { color: theme.colors.success } : { color: theme.colors.placeholderLight }]}>
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

      {/* Floating Action Button */}
      {selectedPlaceId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowConfigModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="pencil" size={28} color="#FFFFFF" />
        </TouchableOpacity>
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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: width / 2,
    borderBottomRightRadius: width / 2,
    transform: [{ scaleX: 1.5 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  placeSelectorContainer: {
    paddingVertical: theme.spacing.md,
  },
  placeSelectorContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  placeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  placeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  placeChipTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
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
    padding: theme.spacing.lg,
    paddingBottom: 80, // Space for FAB
  },
  overviewCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  settingsCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
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
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  settingValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusActive: {
    backgroundColor: `${theme.colors.success}20`,
  },
  statusInactive: {
    backgroundColor: theme.colors.borderLight,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
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
    padding: theme.spacing.lg,
  },
  modalSection: {
    marginBottom: theme.spacing.xl,
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
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    flex: 1,
    fontWeight: theme.typography.fontWeight.medium,
  },
  optionButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
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
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default OwnerRewardsScreen;
