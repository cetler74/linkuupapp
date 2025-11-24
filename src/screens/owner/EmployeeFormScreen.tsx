import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { ownerAPI, type PlaceEmployee, type PlaceService, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import WorkingHoursSelector, { type WorkingHours } from '../../components/employees/WorkingHoursSelector';
import UpgradePrompt from '../../components/billing/UpgradePrompt';

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
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null); // Store original URL for deletion
  const [removePhoto, setRemovePhoto] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [creatingService, setCreatingService] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState<{
    currentPlan?: string;
    limitValue?: number;
    currentCount?: number;
  } | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    is_bookable: true,
  });
  const [workingHours, setWorkingHours] = useState<WorkingHours>(() => {
    // Default: Monday-Friday 9:00-18:00
    return {
      monday: { is_open: true, start_time: '09:00', end_time: '18:00' },
      tuesday: { is_open: true, start_time: '09:00', end_time: '18:00' },
      wednesday: { is_open: true, start_time: '09:00', end_time: '18:00' },
      thursday: { is_open: true, start_time: '09:00', end_time: '18:00' },
      friday: { is_open: true, start_time: '09:00', end_time: '18:00' },
      saturday: { is_open: false },
      sunday: { is_open: false },
    };
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    specialty: '',
    serviceIds: [] as number[],
  });

  const [employeeLoaded, setEmployeeLoaded] = useState(false);
  
  useEffect(() => {
    fetchServices();
    if (employeeId && !employeeLoaded) {
      fetchEmployee();
      setEmployeeLoaded(true);
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
      
      setFormData(prev => ({
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || 'Employee',
        specialty: employee.specialty || '',
        // Only set serviceIds if they're not already set (preserve user's selection)
        serviceIds: prev.serviceIds.length > 0 ? prev.serviceIds : employeeServiceIds,
      }));
      
      // Set existing photo URL if available
      if (employee.photo_url) {
        const photoUrl = getImageUrl(employee.photo_url);
        setExistingPhotoUrl(photoUrl);
        setOriginalPhotoUrl(photoUrl); // Store original for deletion
      }
      
      // Load working hours if available
      if (employee.working_hours && typeof employee.working_hours === 'object') {
        setWorkingHours(employee.working_hours as WorkingHours);
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
        
        // Update working hours
        try {
          await ownerAPI.updateEmployeeHours(savedEmployee.id, workingHours);
        } catch (error) {
          console.error('Error updating working hours:', error);
          // Don't fail the whole operation if hours update fails
        }
        
        // Handle photo upload/removal for existing employee
        if (removePhoto && originalPhotoUrl) {
          // Remove existing photo
          try {
            await ownerAPI.deleteEmployeePhoto(savedEmployee.id);
          } catch (error) {
            console.error('Error deleting photo:', error);
            Alert.alert(
              t('common.warning') || 'Warning',
              t('employees.deletePhotoError') || 'Failed to delete photo. The photo may still be visible.'
            );
            // Don't fail the whole operation if photo deletion fails
          }
        } else if (selectedPhoto) {
          // Upload new photo
          try {
            await uploadPhoto(savedEmployee.id, selectedPhoto);
          } catch (error: any) {
            const errorMessage = error?.message || 
                                t('employees.photoUploadError') || 
                                'Photo upload failed';
            console.error('Error uploading photo:', errorMessage);
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
        
        // Update working hours
        try {
          await ownerAPI.updateEmployeeHours(savedEmployee.id, workingHours);
        } catch (error) {
          console.error('Error updating working hours:', error);
          // Don't fail the whole operation if hours update fails
        }
        
        // Upload photo for new employee
        if (selectedPhoto) {
          try {
            await uploadPhoto(savedEmployee.id, selectedPhoto);
          } catch (error: any) {
            const errorMessage = error?.message || 
                                t('employees.photoUploadError') || 
                                'Photo upload failed';
            console.error('Error uploading photo:', errorMessage);
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
      
      // Handle 402 Payment Required (limit reached)
      if (error.response?.status === 402) {
        const errorData = error.response?.data || {};
        const currentPlan = errorData.currentPlan || 'basic';
        const upgradePlan = errorData.upgradePlan || 'pro';
        
        // Get employee limit for current plan
        let limitValue = 2; // Default for basic
        if (currentPlan.includes('pro')) {
          limitValue = 5;
        }
        
        // Try to get current employee count from error response or fetch it
        let currentCount = limitValue; // Default to limit if not provided
        if (errorData.currentCount !== undefined) {
          currentCount = errorData.currentCount;
        } else if (placeId) {
          // Fetch current employees to get count
          try {
            const employees = await ownerAPI.getPlaceEmployees(placeId);
            currentCount = Array.isArray(employees) ? employees.length : limitValue;
          } catch (fetchError) {
            console.error('Error fetching employees for count:', fetchError);
          }
        }
        
        setUpgradePromptData({
          currentPlan,
          limitValue,
          currentCount,
        });
        setShowUpgradePrompt(true);
        return;
      }
      
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
    if (existingPhotoUrl || originalPhotoUrl) {
      setRemovePhoto(true);
      setSelectedPhoto(null);
      setExistingPhotoUrl(null);
      // Keep originalPhotoUrl so we can delete it on save
    } else {
      setSelectedPhoto(null);
      setRemovePhoto(false);
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
      
      // API expects field name "file" not "photo"
      formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);
      
      await ownerAPI.uploadEmployeePhoto(employeeId, formData);
    } catch (error: any) {
      // Extract error message from various possible error formats
      let errorMessage = 'Unknown error occurred';
      
      if (error) {
        // Check error.message first (this is where uploadEmployeePhoto stores the message)
        if (error.message && typeof error.message === 'string' && error.message !== '[object Object]') {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.response?.data) {
          const errorData = error.response.data;
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            // Try to extract validation errors from FastAPI format
            const validationErrors: string[] = [];
            if (Array.isArray(errorData)) {
              errorData.forEach((err: any) => {
                if (err.msg) validationErrors.push(err.msg);
                if (err.loc && err.msg) {
                  validationErrors.push(`${err.loc.join('.')}: ${err.msg}`);
                }
              });
            }
            if (validationErrors.length > 0) {
              errorMessage = validationErrors.join(', ');
            }
          }
        } else if (error.response?.statusText) {
          errorMessage = error.response.statusText;
        } else if (error.status) {
          errorMessage = `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
        } else {
          // Last resort: try to get a meaningful string representation
          try {
            const errorStr = String(error);
            if (errorStr !== '[object Object]') {
              errorMessage = errorStr;
            } else {
              errorMessage = `Photo upload failed (Status: ${error.status || 'Unknown'})`;
            }
          } catch (e) {
            errorMessage = `Photo upload failed (Status: ${error.status || 'Unknown'})`;
          }
        }
      }
      
      console.error('Error uploading photo:', errorMessage);
      console.error('Error object:', error);
      console.error('Error status:', error?.status);
      console.error('Error response:', error?.response);
      if (error?.response?.data) {
        console.error('Error response data:', error.response.data);
      }
      
      throw new Error(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSelectServices = () => {
    if (!placeId) {
      Alert.alert(t('common.error') || 'Error', t('employees.selectPlaceFirst') || 'Please select a place first');
      return;
    }
    
    if (services.length === 0) {
      // Show inline service creation modal
      setShowServiceModal(true);
      return;
    }
    
    navigation.navigate('EmployeeServiceSelection' as never, {
      placeId,
      employeeId: employeeId || undefined,
      selectedServiceIds: formData.serviceIds,
    } as never);
  };

  const handleCreateService = async () => {
    if (!serviceFormData.name || !serviceFormData.price || !serviceFormData.duration) {
      Alert.alert(t('common.error') || 'Error', t('services.fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    if (!placeId) {
      Alert.alert(t('common.error') || 'Error', t('employees.selectPlaceFirst') || 'Please select a place first');
      return;
    }

    try {
      setCreatingService(true);
      const serviceData = {
        name: serviceFormData.name,
        description: serviceFormData.description || null,
        price: parseFloat(serviceFormData.price),
        duration: parseInt(serviceFormData.duration),
        is_bookable: serviceFormData.is_bookable,
      };

      const response = await ownerAPI.addPlaceService(placeId, serviceData);
      
      // Refresh services list
      await fetchServices();
      
      // Auto-select the newly created service
      if (response.id) {
        setFormData(prev => ({
          ...prev,
          serviceIds: [...prev.serviceIds, response.id],
        }));
      }
      
      // Reset service form
      setServiceFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        is_bookable: true,
      });
      
      setShowServiceModal(false);
    } catch (error: any) {
      console.error('Error creating service:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.response?.data?.detail || error.message || t('services.saveError') || 'Failed to create service'
      );
    } finally {
      setCreatingService(false);
    }
  };

  // Update selected services when returning from service selection screen
  // Use a ref to track if we've already processed the params to avoid clearing form data
  const processedServiceIdsRef = useRef<string>('');
  
  // Use both useFocusEffect and useEffect to catch param changes
  // useFocusEffect runs when screen comes into focus
  // useEffect runs when route.params changes (even if screen is already focused)
  useEffect(() => {
    const params = route.params as any;
    console.log('🔵 EmployeeForm useEffect - route params changed:', JSON.stringify(params));
    
    // Check if selectedServiceIds is present and is an array
    if (params && params.selectedServiceIds !== undefined && params.selectedServiceIds !== null) {
      const selectedIds = Array.isArray(params.selectedServiceIds) ? params.selectedServiceIds : [];
      const selectedIdsKey = JSON.stringify(selectedIds.sort());
      console.log('🟢 Found selectedServiceIds in params:', selectedIds);
      console.log('🟢 Processed ref key:', processedServiceIdsRef.current);
      console.log('🟢 New selection key:', selectedIdsKey);
      
      // Only update if this is a new selection (different from what we've already processed)
      const isNewSelection = processedServiceIdsRef.current !== selectedIdsKey;
      
      console.log('🟡 Is new selection?', isNewSelection);
      
      if (isNewSelection) {
        console.log('✅ Updating selected services from route params:', selectedIds);
        processedServiceIdsRef.current = selectedIdsKey;
        
        // Update serviceIds, preserve all other form data
        setFormData(prev => {
          const prevIdsKey = JSON.stringify([...prev.serviceIds].sort());
          const newIdsKey = JSON.stringify([...selectedIds].sort());
          const idsEqual = prevIdsKey === newIdsKey;
          
          console.log('📝 Previous formData.serviceIds:', prev.serviceIds);
          console.log('📝 IDs equal?', idsEqual);
          
          if (!idsEqual) {
            console.log('✅ Setting new serviceIds:', selectedIds);
            return { ...prev, serviceIds: [...selectedIds] };
          }
          console.log('⏭️ Skipping update - IDs are equal');
          return prev;
        });
      } else {
        console.log('⏭️ Skipping - already processed these IDs');
      }
    } else {
      console.log('🔴 No selectedServiceIds in params');
    }
  }, [route.params]);
  
  // Also use useFocusEffect as a backup
  useFocusEffect(
    useCallback(() => {
      const params = route.params as any;
      console.log('🔵 EmployeeForm useFocusEffect - screen focused, params:', JSON.stringify(params));
      
      if (params && params.selectedServiceIds !== undefined && params.selectedServiceIds !== null) {
        const selectedIds = Array.isArray(params.selectedServiceIds) ? params.selectedServiceIds : [];
        const selectedIdsKey = JSON.stringify(selectedIds.sort());
        
        if (processedServiceIdsRef.current !== selectedIdsKey) {
          console.log('✅ useFocusEffect: Updating selected services:', selectedIds);
          processedServiceIdsRef.current = selectedIdsKey;
          setFormData(prev => ({ ...prev, serviceIds: [...selectedIds] }));
        }
      }
    }, [route.params])
  );

  if (isLoading) {
    return (
        <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
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
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
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
                      {t('employees.addPhoto') || 'Upload Photo'}
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
                {t('employees.selectPhoto') || 'Choose Photo'}
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
          {services.length === 0 ? (
            <View style={styles.noServicesContainer}>
              <Text style={styles.noServicesText}>
                {t('employees.noServicesAvailable') || 'No services available for this place'}
              </Text>
              <Button
                title={t('employees.createService') || 'Create Service'}
                onPress={() => setShowServiceModal(true)}
                variant="primary"
                size="md"
                style={styles.createServiceButton}
              />
            </View>
          ) : (
            <>
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
            </>
          )}
        </View>

        {/* Working Hours Selection */}
        <WorkingHoursSelector
          value={workingHours}
          onChange={setWorkingHours}
        />
      </ScrollView>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && upgradePromptData && (
        <View style={styles.upgradePromptContainer}>
          <UpgradePrompt
            currentPlan={upgradePromptData.currentPlan || 'basic'}
            limitType="employees"
            currentCount={upgradePromptData.currentCount || upgradePromptData.limitValue || 2}
            limitValue={upgradePromptData.limitValue || 2}
            onDismiss={() => setShowUpgradePrompt(false)}
          />
        </View>
      )}

      {/* Service Creation Modal */}
      <Modal
        visible={showServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('employees.createService') || 'Create Service'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowServiceModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              <Input
                label={t('services.name') || 'Service Name *'}
                value={serviceFormData.name}
                onChangeText={(text) => setServiceFormData({ ...serviceFormData, name: text })}
                placeholder={t('services.namePlaceholder') || 'Enter service name'}
              />
              <Input
                label={t('services.description') || 'Description'}
                value={serviceFormData.description}
                onChangeText={(text) => setServiceFormData({ ...serviceFormData, description: text })}
                placeholder={t('services.descriptionPlaceholder') || 'Enter service description'}
                multiline
                numberOfLines={3}
              />
              <Input
                label={t('services.price') || 'Price *'}
                value={serviceFormData.price}
                onChangeText={(text) => setServiceFormData({ ...serviceFormData, price: text })}
                placeholder={t('services.pricePlaceholder') || '0.00'}
                keyboardType="decimal-pad"
              />
              <Input
                label={t('services.duration') || 'Duration (minutes) *'}
                value={serviceFormData.duration}
                onChangeText={(text) => setServiceFormData({ ...serviceFormData, duration: text })}
                placeholder={t('services.durationPlaceholder') || '30'}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel') || 'Cancel'}
                onPress={() => setShowServiceModal(false)}
                variant="outline"
                size="lg"
                style={styles.modalButton}
                disabled={creatingService}
              />
              <Button
                title={creatingService ? (t('common.saving') || 'Saving...') : (t('common.create') || 'Create')}
                onPress={handleCreateService}
                variant="primary"
                size="lg"
                style={styles.modalButton}
                loading={creatingService}
                disabled={creatingService}
              />
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
    textAlign: 'left',
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
  upgradePromptContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
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
  noServicesContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  noServicesText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  createServiceButton: {
    minWidth: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: theme.spacing.md,
  },
  modalActions: {
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

export default EmployeeFormScreen;

