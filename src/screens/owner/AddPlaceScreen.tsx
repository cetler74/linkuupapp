import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { ownerAPI } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const AddPlaceScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    booking_enabled: true,
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: 38.7223,
    longitude: -9.1393,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error') || 'Error',
        t('places.imagePermissionDenied') || 'Permission to access camera roll is required!'
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.uri.split('/').pop() || `image_${Date.now()}.jpg`,
        }));
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('places.imagePickError') || 'Failed to pick images. Please try again.'
      );
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error') || 'Error',
        t('places.locationPermissionDenied') || 'Permission to access location is required!'
      );
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setFormData({
        ...formData,
        latitude: latitude,
        longitude: longitude,
      });
      
      setMapRegion({
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('places.locationError') || 'Failed to get current location. Please try again.'
      );
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFormData({
      ...formData,
      latitude: latitude,
      longitude: longitude,
    });
  };

  const handleMarkerDragEnd = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFormData({
      ...formData,
      latitude: latitude,
      longitude: longitude,
    });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name || !formData.city) {
      Alert.alert(
        t('common.error') || 'Error',
        'Please fill in place name and city'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      const placeData: any = {
        nome: formData.name,
        tipo: formData.sector || 'other',
        about: formData.description || '',
        rua: formData.address || '',
        cidade: formData.city,
        cod_postal: formData.postal_code || '',
        telefone: formData.phone || '',
        email: formData.email || '',
        booking_enabled: formData.booking_enabled,
        is_active: true,
        pais: 'Portugal',
        regiao: formData.city,
        porta: '',
        is_bio_diamond: false,
        location_type: 'fixed' as const,
      };

      // Add coordinates if they exist
      if (formData.latitude !== null && formData.longitude !== null) {
        placeData.latitude = formData.latitude;
        placeData.longitude = formData.longitude;
      }

      const createdPlace = await ownerAPI.createPlace(placeData);
      
      // Upload images if any were selected
      if (selectedImages.length > 0 && createdPlace.id) {
        try {
          setUploadingImages(true);
          await ownerAPI.uploadPlaceImages(createdPlace.id, selectedImages);
        } catch (imageError) {
          console.error('Error uploading images:', imageError);
          Alert.alert(
            t('common.warning') || 'Warning',
            t('places.placeSavedButImagesFailed') || 'Place saved but failed to upload images. You can add them later.'
          );
        } finally {
          setUploadingImages(false);
        }
      }
      
      Alert.alert(
        t('common.success') || 'Success',
        t('owner.places.placeCreated') || 'Place created successfully!',
        [
          {
            text: t('common.close') || 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating place:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.message || t('owner.places.createError') || 'Failed to create place. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('places.addNewPlace') || 'Add New Place'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {t('owner.dashboard.basicInformation') || 'Basic Information'}
          </Text>

          <Input
            placeholder={t('owner.dashboard.businessName') || 'Business Name *'}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
          />

          <Input
            placeholder={t('owner.dashboard.businessSector') || 'Sector (e.g., Beauty, Wellness)'}
            value={formData.sector}
            onChangeText={(text) => setFormData({ ...formData, sector: text })}
            style={styles.input}
          />

          <Input
            placeholder={t('owner.dashboard.businessDescriptionPlaceholder') || 'Description'}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />

          <Text style={styles.sectionTitle}>
            {t('owner.dashboard.locationDetails') || 'Location'}
          </Text>

          <Input
            placeholder={t('owner.dashboard.address') || 'Address'}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            style={styles.input}
          />

          <Input
            placeholder={t('owner.dashboard.city') || 'City *'}
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            style={styles.input}
          />

          <Input
            placeholder={t('owner.dashboard.postalCode') || 'Postal Code'}
            value={formData.postal_code}
            onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>
            {t('places.locationPinpoint') || 'Location on Map'}
          </Text>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onPress={handleMapPress}
              onRegionChangeComplete={setMapRegion}
            >
              {formData.latitude !== null && formData.longitude !== null && (
                <Marker
                  coordinate={{
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                  }}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                  title={formData.name || t('places.placeLocation') || 'Place Location'}
                />
              )}
            </MapView>
          </View>

          <View style={styles.mapButtonsContainer}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={getCurrentLocation}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={theme.colors.primary} />
              <Text style={styles.mapButtonText}>
                {t('places.useCurrentLocation') || 'Use Current Location'}
              </Text>
            </TouchableOpacity>
            {formData.latitude !== null && formData.longitude !== null && (
              <TouchableOpacity
                style={styles.mapButtonSecondary}
                onPress={() => {
                  setFormData({
                    ...formData,
                    latitude: null,
                    longitude: null,
                  });
                }}
              >
                <MaterialCommunityIcons name="map-marker-off" size={20} color={theme.colors.placeholderLight} />
                <Text style={styles.mapButtonTextSecondary}>
                  {t('places.clearLocation') || 'Clear Location'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {formData.latitude !== null && formData.longitude !== null && (
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesText}>
                {t('places.latitude') || 'Latitude'}: {formData.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                {t('places.longitude') || 'Longitude'}: {formData.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            {t('owner.dashboard.contactInformation') || 'Contact'}
          </Text>

          <Input
            placeholder={t('owner.dashboard.phoneNumber') || 'Phone Number'}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Input
            placeholder={t('owner.dashboard.emailAddress') || 'Email Address'}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>
            {t('places.images') || 'Images'}
          </Text>

          <TouchableOpacity onPress={pickImages} style={styles.imagePickerButton}>
            <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary} />
            <Text style={styles.imagePickerText}>
              {t('places.imagesVideos') || 'Add Images (Optional)'}
            </Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.imagePreviewLabel}>
                {t('places.selectedFiles') || 'Selected files:'} {selectedImages.length}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image source={{ uri: image.uri }} style={styles.previewImage} contentFit="cover" />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title={
                uploadingImages
                  ? t('places.uploadingFiles') || 'Uploading files...'
                  : isSubmitting
                  ? t('common.loading') || 'Creating...'
                  : t('owner.dashboard.createPlace') || 'Create Place'
              }
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              disabled={isSubmitting || uploadingImages}
              style={styles.submitButton}
            />
            <Button
              title={t('common.cancel') || 'Cancel'}
              onPress={() => navigation.goBack()}
              variant="outline"
              size="lg"
              style={styles.cancelButton}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
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
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    padding: theme.spacing.md,
  },
  formCard: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  submitButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}10`,
    marginBottom: theme.spacing.md,
  },
  imagePickerText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  imagePreviewContainer: {
    marginBottom: theme.spacing.md,
  },
  imagePreviewLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.sm,
  },
  imageScrollView: {
    marginTop: theme.spacing.sm,
  },
  imagePreview: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.borderLight,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.full,
  },
  mapContainer: {
    height: 250,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapButtonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.xs,
  },
  mapButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.xs,
  },
  mapButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  mapButtonTextSecondary: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  coordinatesContainer: {
    backgroundColor: `${theme.colors.primary}10`,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  coordinatesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
});

export default AddPlaceScreen;

