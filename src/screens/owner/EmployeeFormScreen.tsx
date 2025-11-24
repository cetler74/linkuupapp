import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { ownerAPI, type PlaceEmployee, type PlaceService, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const EmployeeFormScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId, employeeId } = (route.params as any) || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [services, setServices] = useState<PlaceService[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    specialty: '',
    serviceIds: [] as number[],
  });

  useEffect(() => {
    fetchServices();
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId, placeId]);

  const fetchServices = async () => {
    if (!placeId) return;
    try {
      const response = await ownerAPI.getPlaceServices(placeId);
      setServices(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const fetchEmployee = async () => {
    if (!employeeId) return;
    try {
      setIsLoading(true);
      const employee = await ownerAPI.getEmployee(employeeId);
      
      // Fetch services assigned to this employee
      let employeeServiceIds: number[] = [];
      try {
        const employeeServices = await ownerAPI.getEmployeeServices(employeeId);
        if (Array.isArray(employeeServices)) {
          employeeServiceIds = employeeServices.map(s => s.id);
        }
      } catch (error) {
        console.error('Error fetching employee services:', error);
      }
      
      setFormData({
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || 'Employee',
        specialty: employee.specialty || '',
        serviceIds: employeeServiceIds,
      });
      
      // Set existing photo URL if available
      if (employee.photo_url) {
        setExistingPhotoUrl(getImageUrl(employee.photo_url));
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      Alert.alert(t('common.error') || 'Error', t('employees.loadError') || 'Failed to load employee');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert(t('common.error') || 'Error', t('employees.fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    if (!placeId) {
      Alert.alert(t('common.error') || 'Error', t('employees.selectPlaceFirst') || 'Please select a place first');
      return;
    }

    try {
      setSubmitting(true);
      const employeeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        specialty: formData.specialty || null,
      };

      let savedEmployee: PlaceEmployee;

      if (employeeId) {
        // Update existing employee
        savedEmployee = await ownerAPI.updateEmployee(employeeId, employeeData);
        
        // Assign services using the dedicated endpoint
        await ownerAPI.assignServicesToEmployee(savedEmployee.id, formData.serviceIds);
        
        // Handle photo upload/removal for existing employee
        if (removePhoto && existingPhotoUrl) {
          // Remove existing photo
          try {
            await ownerAPI.deleteEmployeePhoto(savedEmployee.id);
          } catch (error) {
            console.error('Error deleting photo:', error);
            // Don't fail the whole operation if photo deletion fails
          }
        } else if (selectedPhoto) {
          // Upload new photo
          try {
            await uploadPhoto(savedEmployee.id, selectedPhoto);
          } catch (error: any) {
            console.error('Error uploading photo:', error);
            const errorMessage = error?.message || error?.toString() || t('employees.photoUploadError') || 'Photo upload failed';
            Alert.alert(
              t('common.warning') || 'Warning',
              errorMessage
            );
          }
        }
      } else {
        // Create new employee
        savedEmployee = await ownerAPI.createEmployee(placeId, employeeData);
        
        // Assign services using the dedicated endpoint
        if (formData.serviceIds.length > 0) {
          await ownerAPI.assignServicesToEmployee(savedEmployee.id, formData.serviceIds);
        }
        
        // Upload photo for new employee
        if (selectedPhoto) {
          try {
            await uploadPhoto(savedEmployee.id, selectedPhoto);
          } catch (error: any) {
            console.error('Error uploading photo:', error);
            const errorMessage = error?.message || error?.toString() || t('employees.photoUploadError') || 'Photo upload failed';
            Alert.alert(
              t('common.warning') || 'Warning',
              errorMessage
            );
          }
        }
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.response?.data?.detail || error.message || t('employees.saveError') || 'Failed to save employee'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error') || 'Error',
        t('employees.imagePermissionDenied') || 'Permission to access camera roll is required!'
      );
      return false;
    }
    return true;
  };

  const pickPhoto = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedPhoto({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`,
        });
        setRemovePhoto(false); // If selecting new photo, don't remove existing
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('employees.imagePickError') || 'Failed to pick photo. Please try again.'
      );
    }
  };

  const handleRemovePhoto = () => {
    if (existingPhotoUrl) {
      setRemovePhoto(true);
      setSelectedPhoto(null);
      setExistingPhotoUrl(null);
    } else {
      setSelectedPhoto(null);
    }
  };

  const uploadPhoto = async (employeeId: number, photo: { uri: string; type: string; name: string }) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      
      // Ensure URI is properly formatted
      let imageUri = photo.uri;
      if (imageUri && !imageUri.startsWith('http') && !imageUri.startsWith('file://')) {
        if (imageUri.startsWith('/')) {
          imageUri = `file://${imageUri}`;
        } else {
          imageUri = `file:///${imageUri}`;
        }
      }
      
      const fileExtension = photo.name?.split('.').pop() || imageUri?.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = photo.name || `photo_${Date.now()}.${fileExtension}`;
      
      // Determine MIME type
      let mimeType = photo.type;
      if (!mimeType) {
        if (fileExtension.toLowerCase() === 'png') {
          mimeType = 'image/png';
        } else {
          mimeType = 'image/jpeg';
        }
      }
      
      formData.append('photo', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);
      
      await ownerAPI.uploadEmployeePhoto(employeeId, formData);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSelectServices = () => {
    navigation.navigate('EmployeeServiceSelection' as never, {
      placeId,
      selectedServiceIds: formData.serviceIds,
    } as never);
  };

  // Update selected services when returning from service selection screen
  useFocusEffect(
    useCallback(() => {
      const currentRoute = route;
      if (currentRoute.params && (currentRoute.params as any).selectedServiceIds) {
        const selectedIds = (currentRoute.params as any).selectedServiceIds;
        setFormData(prev => ({ ...prev, serviceIds: selectedIds }));
        // Clear the params to avoid re-applying on next focus
        navigation.setParams({ selectedServiceIds: undefined } as never);
      }
    }, [route, navigation])
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {employeeId ? t('employees.editEmployee') || 'Edit Employee' : t('employees.addEmployee') || 'Add Employee'}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {employeeId ? t('employees.editEmployee') || 'Edit Employee' : t('employees.addEmployee') || 'Add Employee'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>
            {t('employees.photo') || 'Photo'}
          </Text>
          <View style={styles.photoContainer}>
            {(selectedPhoto || existingPhotoUrl) && !removePhoto ? (
              <View style={styles.photoPreview}>
                <Image
                  source={{ uri: selectedPhoto?.uri || existingPhotoUrl || '' }}
                  style={styles.photoImage}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={handleRemovePhoto}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoPlaceholder}
                onPress={pickPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="camera"
                      size={48}
                      color={theme.colors.placeholderLight}
                    />
                    <Text style={styles.photoPlaceholderText}>
                      {t('employees.addPhoto') || 'Add Photo'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          {!selectedPhoto && !existingPhotoUrl && (
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickPhoto}
              disabled={uploadingPhoto}
            >
              <Text style={styles.changePhotoButtonText}>
                {t('employees.selectPhoto') || 'Select Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Input
          label={t('employees.name') || 'Name *'}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder={t('employees.namePlaceholder') || 'Enter employee name'}
        />
        <Input
          label={t('employees.email') || 'Email *'}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder={t('employees.emailPlaceholder') || 'Enter email address'}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label={t('employees.phone') || 'Phone'}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder={t('employees.phonePlaceholder') || 'Enter phone number'}
          keyboardType="phone-pad"
        />
        <Input
          label={t('employees.role') || 'Role'}
          value={formData.role}
          onChangeText={(text) => setFormData({ ...formData, role: text })}
          placeholder={t('employees.rolePlaceholder') || 'Enter role'}
        />
        <Input
          label={t('employees.specialty') || 'Specialty'}
          value={formData.specialty}
          onChangeText={(text) => setFormData({ ...formData, specialty: text })}
          placeholder={t('employees.specialtyPlaceholder') || 'Enter specialty'}
        />
        
        {/* Services Selection */}
        <View style={styles.servicesSection}>
          <Text style={styles.servicesLabel}>
            {t('employees.services') || 'Services'}
          </Text>
          <TouchableOpacity
            style={styles.servicesButton}
            onPress={handleSelectServices}
          >
            <Text style={styles.servicesButtonText}>
              {formData.serviceIds.length > 0
                ? `${formData.serviceIds.length} ${t('employees.servicesSelected') || 'service(s) selected'}`
                : t('employees.selectServices') || 'Select Services'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
          {formData.serviceIds.length > 0 && (
            <View style={styles.selectedServicesContainer}>
              {formData.serviceIds.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                if (!service) return null;
                return (
                  <View key={serviceId} style={styles.selectedServiceTag}>
                    <Text style={styles.selectedServiceText}>{service.name}</Text>
                    <TouchableOpacity
                      onPress={() => toggleService(serviceId)}
                      style={styles.removeServiceButton}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={14}
                        color={theme.colors.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={t('common.cancel') || 'Cancel'}
          onPress={() => navigation.goBack()}
          variant="outline"
          size="lg"
          style={styles.footerButton}
          disabled={submitting}
        />
        <Button
          title={submitting || uploadingPhoto
            ? (t('common.saving') || 'Saving...')
            : (employeeId
                ? t('common.update') || 'Update'
                : t('common.create') || 'Create')}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          style={styles.footerButton}
          loading={submitting || uploadingPhoto}
          disabled={submitting || uploadingPhoto}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesSection: {
    marginBottom: theme.spacing.md,
  },
  servicesLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  servicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
  },
  servicesButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  selectedServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  selectedServiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  selectedServiceText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
  },
  removeServiceButton: {
    padding: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.backgroundLight,
  },
  footerButton: {
    flex: 1,
  },
  photoSection: {
    marginBottom: theme.spacing.md,
  },
  photoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  photoPreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.full,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  photoPlaceholderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
  changePhotoButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignSelf: 'center',
  },
  changePhotoButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default EmployeeFormScreen;

