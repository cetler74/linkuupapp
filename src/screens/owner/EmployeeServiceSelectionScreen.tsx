import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type PlaceService } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EmployeeServiceSelectionScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId, selectedServiceIds = [], onSelect } = (route.params as any) || {};
  
  const [services, setServices] = useState<PlaceService[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>(selectedServiceIds);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, [placeId]);

  const fetchServices = async () => {
    if (!placeId) return;
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceServices(placeId);
      setServices(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: number) => {
    console.log('🟢 toggleService called with serviceId:', serviceId);
    console.log('🟢 Current selectedServices before toggle:', selectedServices);
    setSelectedServices(prev => {
      const newSelection = prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
      console.log('🟢 New selectedServices after toggle:', newSelection);
      return newSelection;
    });
  };

  const handleDone = () => {
    // Pass selected services back via navigation params
    const { employeeId } = (route.params as any) || {};
    
    console.log('🟢 EmployeeServiceSelection handleDone - selectedServices:', selectedServices);
    console.log('🟢 EmployeeServiceSelection handleDone - placeId:', placeId);
    console.log('🟢 EmployeeServiceSelection handleDone - employeeId:', employeeId);
    
    // Navigate back to EmployeeForm with updated params
    // Using navigate will update the existing screen if it's in the stack
    // This preserves form state while updating the selectedServiceIds param
    (navigation as any).navigate('EmployeeForm', {
      placeId,
      employeeId: employeeId || undefined,
      selectedServiceIds: selectedServices,
    });
    
    console.log('🟢 Navigation called with params:', {
      placeId,
      employeeId: employeeId || undefined,
      selectedServiceIds: selectedServices,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('employees.selectServices') || 'Select Services'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Services List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="content-cut"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyText}>
            {t('employees.noServicesAvailable') || 'No services available for this place'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.servicesList} contentContainerStyle={styles.servicesListContent}>
          {services.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => {
                  console.log('🟢 Service card pressed, serviceId:', service.id);
                  toggleService(service.id);
                }}
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
                      <Text style={styles.serviceDetails}>
                        {service.duration} {t('booking.min') || 'min'} • €{service.price?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {selectedServices.length > 0
            ? `${selectedServices.length} ${t('employees.servicesSelected') || 'service(s) selected'}`
            : t('employees.noServicesSelected') || 'No services selected'}
        </Text>
        <Button
          title={t('common.done') || 'Done'}
          onPress={handleDone}
          variant="primary"
          size="lg"
          style={styles.doneButton}
        />
      </View>
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
  headerRight: {
    width: 40,
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
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginTop: theme.spacing.md,
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
  serviceCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
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
    marginBottom: theme.spacing.xs,
  },
  serviceDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.backgroundLight,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  doneButton: {
    width: '100%',
  },
});

export default EmployeeServiceSelectionScreen;

