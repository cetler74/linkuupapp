import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { placeAPI, type PlaceService } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const ServiceSelectionScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { placeId, placeName } = (route.params as any) || {};
  
  const [services, setServices] = useState<PlaceService[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, [placeId]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      // Try to get place by ID or slug
      let place;
      try {
        place = await placeAPI.getPlace(placeId.toString());
      } catch (e) {
        // If getPlace fails, try fetching from places list
        const places = await placeAPI.getPlaces({}, 1, 100);
        const placeList = Array.isArray(places) ? places : places.places || [];
        place = placeList.find(p => p.id === placeId);
      }
      if (place) {
        setServices(place.services || []);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.duration || 0);
    }, 0);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      navigation.navigate('EmployeeSelection' as never, {
        placeId,
        placeName,
        selectedServices,
        totalPrice: calculateTotal(),
        totalDuration: calculateTotalDuration(),
      } as never);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {placeName || t('booking.selectServices') || 'Select Services'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('booking.searchServices') || 'Search for a service'}
          placeholderTextColor={theme.colors.placeholderLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Services List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.servicesList} contentContainerStyle={styles.servicesListContent}>
          {filteredServices.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => toggleService(service.id)}
                activeOpacity={0.7}
              >
                <Card style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}>
                  <View style={styles.serviceContent}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.description && (
                        <Text style={styles.serviceDescription} numberOfLines={2}>
                          {service.description}
                        </Text>
                      )}
                      <Text style={styles.servicePrice}>
                        {service.duration} {t('booking.min') || 'min'} • €{service.price.toFixed(2)}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
          {filteredServices.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('booking.noServicesFound') || 'No services found'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom Bar */}
      {selectedServices.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarContent}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>
                {t('booking.total') || 'Total'}: {selectedServices.length} {t('booking.services') || 'services'}
              </Text>
              <Text style={styles.totalPrice}>€{calculateTotal().toFixed(2)}</Text>
            </View>
            <Button
              title={t('common.continue') || 'Continue'}
              onPress={handleContinue}
              variant="primary"
              size="lg"
              style={styles.continueButton}
            />
          </View>
        </View>
      )}
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
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.textLight,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    height: 48,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  servicesList: {
    flex: 1,
  },
  servicesListContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  serviceCard: {
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  serviceDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  servicePrice: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${theme.colors.backgroundLight}E6`,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    padding: theme.spacing.md,
  },
  bottomBarContent: {
    gap: theme.spacing.sm,
  },
  totalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  totalPrice: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  continueButton: {
    width: '100%',
  },
});

export default ServiceSelectionScreen;

