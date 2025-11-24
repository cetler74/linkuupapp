import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type PlaceService, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ServicesManagementScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId } = (route.params as any) || {};
  
  const [place, setPlace] = useState<Place | null>(null);
  const [services, setServices] = useState<PlaceService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<PlaceService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    is_bookable: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (placeId) {
      fetchPlace();
      fetchServices();
    }
  }, [placeId]);

  const fetchPlace = async () => {
    try {
      const places = await ownerAPI.getOwnerPlaces();
      const foundPlace = places.find(p => p.id === placeId);
      setPlace(foundPlace || null);
    } catch (error) {
      console.error('Error fetching place:', error);
    }
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceServices(placeId);
      setServices(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      is_bookable: true,
    });
    setShowModal(true);
  };

  const handleEdit = (service: PlaceService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price?.toString() || '',
      duration: service.duration?.toString() || '',
      is_bookable: service.is_available,
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceId: number) => {
    Alert.alert(
      t('common.confirmDelete') || 'Confirm Delete',
      t('services.confirmDeleteMessage') || 'Are you sure you want to delete this service?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerAPI.deletePlaceService(placeId, serviceId);
              fetchServices();
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert(t('common.error') || 'Error', t('services.deleteError') || 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
      Alert.alert(t('common.error') || 'Error', t('services.fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        is_bookable: formData.is_bookable,
      };

      if (editingService) {
        await ownerAPI.updatePlaceService(placeId, editingService.id, serviceData);
      } else {
        await ownerAPI.addPlaceService(placeId, serviceData);
      }

      setShowModal(false);
      setEditingService(null);
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.response?.data?.detail || error.message || t('services.saveError') || 'Failed to save service'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('services.manageServices') || 'Manage Services'}
        </Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {place && (
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{place.nome}</Text>
          <Text style={styles.placeLocation}>{place.cidade}</Text>
        </View>
      )}

      {/* Services List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : services.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <MaterialCommunityIcons
            name="content-cut"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyTitle}>
            {t('services.noServices') || 'No Services Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {t('services.addFirstService') || 'Add your first service to get started'}
          </Text>
          <Button
            title={t('services.addService') || 'Add Service'}
            onPress={handleAdd}
            variant="primary"
            size="lg"
            style={styles.emptyButton}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.servicesList}
          contentContainerStyle={styles.servicesListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {services.map((service) => (
            <Card key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                  <View style={styles.serviceDetails}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={16}
                        color={theme.colors.placeholderLight}
                      />
                      <Text style={styles.detailText}>
                        {service.duration} {t('booking.min') || 'min'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="currency-eur"
                        size={16}
                        color={theme.colors.placeholderLight}
                      />
                      <Text style={styles.detailText}>
                        €{service.price?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(service)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(service.id)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={20}
                      color={theme.colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService
                  ? t('services.editService') || 'Edit Service'
                  : t('services.addService') || 'Add Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label={t('services.serviceName') || 'Service Name *'}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t('services.serviceNamePlaceholder') || 'Enter service name'}
              />
              <Input
                label={t('services.description') || 'Description'}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder={t('services.descriptionPlaceholder') || 'Enter service description'}
                multiline
                numberOfLines={3}
              />
              <Input
                label={t('services.price') || 'Price (€) *'}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <Input
                label={t('services.duration') || 'Duration (minutes) *'}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                placeholder="60"
                keyboardType="number-pad"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={t('common.cancel') || 'Cancel'}
                onPress={() => setShowModal(false)}
                variant="outline"
                size="md"
                style={styles.modalButton}
                disabled={submitting}
              />
              <Button
                title={submitting
                  ? (t('common.saving') || 'Saving...')
                  : (editingService
                      ? t('common.update') || 'Update'
                      : t('common.create') || 'Create')}
                onPress={handleSubmit}
                variant="primary"
                size="md"
                style={styles.modalButton}
                loading={submitting}
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  placeInfo: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}10`,
  },
  placeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  placeLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs,
  },
  servicesList: {
    flex: 1,
  },
  servicesListContent: {
    padding: theme.spacing.md,
  },
  serviceCard: {
    marginBottom: theme.spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  serviceName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  serviceDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
    maxWidth: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
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
  modalBody: {
    padding: theme.spacing.md,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  modalButton: {
    flex: 1,
  },
});

export default ServicesManagementScreen;

