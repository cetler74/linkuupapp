import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, Dimensions, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

interface Campaign {
  id: number;
  name: string;
  description?: string;
  banner_message: string;
  campaign_type: 'price_reduction' | 'rewards_increase' | 'free_service' | 'messaging';
  start_datetime: string;
  end_datetime: string;
  is_active: boolean;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
}

const CampaignsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId: routePlaceId } = (route.params as any) || {};

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(routePlaceId || null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    banner_message: '',
    campaign_type: 'price_reduction' as Campaign['campaign_type'],
    start_datetime: '',
    end_datetime: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 10,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchCampaigns();
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

  const fetchCampaigns = async () => {
    if (!selectedPlaceId) return;
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceCampaigns(selectedPlaceId);
      setCampaigns(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleAdd = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      banner_message: '',
      campaign_type: 'price_reduction',
      start_datetime: '',
      end_datetime: '',
      discount_type: 'percentage',
      discount_value: 10,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      banner_message: campaign.banner_message,
      campaign_type: campaign.campaign_type,
      start_datetime: campaign.start_datetime.split('T')[0],
      end_datetime: campaign.end_datetime.split('T')[0],
      discount_type: campaign.discount_type || 'percentage',
      discount_value: campaign.discount_value || 10,
      is_active: campaign.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (campaignId: number) => {
    Alert.alert(
      t('common.delete') || 'Delete',
      t('campaigns.confirmDelete') || 'Are you sure you want to delete this campaign?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerAPI.deleteCampaign(campaignId);
              Alert.alert(t('common.success') || 'Success', t('campaigns.deleteSuccess') || 'Campaign deleted successfully!');
              fetchCampaigns();
            } catch (error) {
              console.error('Error deleting campaign:', error);
              Alert.alert(t('common.error') || 'Error', t('campaigns.deleteError') || 'Failed to delete campaign.');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.banner_message || !formData.start_datetime || !formData.end_datetime) {
      Alert.alert(t('common.error') || 'Error', t('campaigns.fillAllFields') || 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const campaignData = {
        name: formData.name,
        description: formData.description,
        banner_message: formData.banner_message,
        campaign_type: formData.campaign_type,
        start_datetime: `${formData.start_datetime}T00:00:00`,
        end_datetime: `${formData.end_datetime}T23:59:59`,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        is_active: formData.is_active,
        place_ids: selectedPlaceId ? [selectedPlaceId] : [],
      };

      if (editingCampaign) {
        await ownerAPI.updateCampaign(editingCampaign.id, campaignData);
      } else {
        await ownerAPI.createCampaign(campaignData);
      }

      setShowModal(false);
      setEditingCampaign(null);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      Alert.alert(t('common.error') || 'Error', error.message || (t('campaigns.saveError') || 'Failed to save campaign.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'price_reduction':
        return 'tag';
      case 'rewards_increase':
        return 'gift';
      case 'free_service':
        return 'gift-outline';
      case 'messaging':
        return 'message-text';
      default:
        return 'bullhorn';
    }
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'price_reduction':
        return theme.colors.primary;
      case 'rewards_increase':
        return '#10b981';
      case 'free_service':
        return '#f59e0b';
      case 'messaging':
        return '#8b5cf6';
      default:
        return theme.colors.placeholderLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isActive = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_datetime);
    const end = new Date(campaign.end_datetime);
    return campaign.is_active && now >= start && now <= end;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('campaigns.title') || 'Campaigns'}
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

      {/* Campaigns List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : campaigns.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <MaterialCommunityIcons
            name="bullhorn-outline"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyTitle}>
            {t('campaigns.noCampaigns') || 'No Campaigns'}
          </Text>
          <Text style={styles.emptyText}>
            {t('campaigns.noCampaignsDesc') || 'Create your first promotional campaign to attract more customers.'}
          </Text>
          <Button
            title={t('campaigns.createCampaign') || 'Create Campaign'}
            onPress={handleAdd}
            variant="primary"
            style={styles.emptyButton}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {campaigns.map((campaign) => {
            const iconColor = getCampaignTypeColor(campaign.campaign_type);
            const active = isActive(campaign);
            return (
              <Card key={campaign.id} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                    <MaterialCommunityIcons
                      name={getCampaignTypeIcon(campaign.campaign_type) as any}
                      size={24}
                      color={iconColor}
                    />
                  </View>
                  <View style={styles.campaignInfo}>
                    <Text style={styles.campaignName}>{campaign.name}</Text>
                    <Text style={styles.campaignBanner}>{campaign.banner_message}</Text>
                    <Text style={styles.campaignPeriod}>
                      {formatDate(campaign.start_datetime)} - {formatDate(campaign.end_datetime)}
                    </Text>
                  </View>
                  <View style={styles.campaignActions}>
                    <View style={[styles.statusBadge, active ? styles.statusActive : styles.statusInactive]}>
                      <Text style={styles.statusText}>
                        {active ? (t('campaigns.active') || 'Active') : (t('campaigns.inactive') || 'Inactive')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleEdit(campaign)} style={styles.actionIcon}>
                      <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(campaign.id)} style={styles.actionIcon}>
                      <MaterialCommunityIcons name="delete" size={20} color={theme.colors.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {selectedPlaceId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Add/Edit Campaign Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCampaign ? (t('campaigns.editCampaign') || 'Edit Campaign') : (t('campaigns.createCampaign') || 'Create Campaign')}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Input
                label={t('campaigns.name') || 'Campaign Name'}
                placeholder={t('campaigns.namePlaceholder') || 'Enter campaign name'}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
              />
              <Input
                label={t('campaigns.description') || 'Description'}
                placeholder={t('campaigns.descriptionPlaceholder') || 'Enter description (optional)'}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <Input
                label={t('campaigns.bannerMessage') || 'Banner Message'}
                placeholder={t('campaigns.bannerMessagePlaceholder') || 'Enter banner message'}
                value={formData.banner_message}
                onChangeText={(text) => setFormData({ ...formData, banner_message: text })}
                multiline
                numberOfLines={2}
                style={styles.input}
              />
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  {t('campaigns.campaignType') || 'Campaign Type'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.campaign_type === 'price_reduction' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, campaign_type: 'price_reduction' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.campaign_type === 'price_reduction' && styles.optionTextActive,
                    ]}
                  >
                    {t('campaigns.priceReduction') || 'Price Reduction'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.campaign_type === 'rewards_increase' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, campaign_type: 'rewards_increase' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.campaign_type === 'rewards_increase' && styles.optionTextActive,
                    ]}
                  >
                    {t('campaigns.rewardsIncrease') || 'Rewards Increase'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Input
                label={t('campaigns.startDate') || 'Start Date'}
                placeholder="YYYY-MM-DD"
                value={formData.start_datetime}
                onChangeText={(text) => setFormData({ ...formData, start_datetime: text })}
                style={styles.input}
              />
              <Input
                label={t('campaigns.endDate') || 'End Date'}
                placeholder="YYYY-MM-DD"
                value={formData.end_datetime}
                onChangeText={(text) => setFormData({ ...formData, end_datetime: text })}
                style={styles.input}
              />
              {formData.campaign_type === 'price_reduction' && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      {t('campaigns.discountType') || 'Discount Type'}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        formData.discount_type === 'percentage' && styles.optionButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, discount_type: 'percentage' })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.discount_type === 'percentage' && styles.optionTextActive,
                        ]}
                      >
                        {t('campaigns.percentage') || 'Percentage'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        formData.discount_type === 'fixed_amount' && styles.optionButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, discount_type: 'fixed_amount' })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.discount_type === 'fixed_amount' && styles.optionTextActive,
                        ]}
                      >
                        {t('campaigns.fixed') || 'Fixed Amount'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Input
                    label={t('campaigns.discountValue') || 'Discount Value'}
                    placeholder="10"
                    value={formData.discount_value?.toString() || '10'}
                    onChangeText={(text) => setFormData({ ...formData, discount_value: parseFloat(text) || 10 })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel') || 'Cancel'}
                onPress={() => setShowModal(false)}
                variant="secondary"
                style={styles.modalButton}
                disabled={submitting}
              />
              <Button
                title={submitting ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
                onPress={handleSave}
                variant="primary"
                style={styles.modalButton}
                disabled={submitting}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
    right: theme.spacing.md,
    bottom: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  placeSelectorContent: {
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
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    width: '80%',
    maxWidth: 300,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  campaignCard: {
    marginBottom: theme.spacing.md,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  campaignBanner: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  campaignPeriod: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  campaignActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  actionIcon: {
    padding: theme.spacing.xs,
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
  input: {
    marginBottom: theme.spacing.md,
  },
  modalSection: {
    marginBottom: theme.spacing.md,
  },
  modalSectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
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

export default CampaignsScreen;
