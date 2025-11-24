import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker } from 'react-native-maps';
import { ownerAPI, type Place, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const PlaceDetailsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { placeId } = (route.params as any) || {};
  
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (placeId) {
      fetchPlaceDetails();
    }
  }, [placeId]);

  const fetchPlaceDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const placeData = await ownerAPI.getPlace(placeId);
      
      // Fetch images separately using the images endpoint
      try {
        const images = await ownerAPI.getPlaceImages(placeId);
        placeData.images = images || [];
      } catch (imageError) {
        console.error('Error fetching place images:', imageError);
        // Continue even if images fail to load
        placeData.images = [];
      }
      
      setPlace(placeData);
    } catch (err: any) {
      console.error('Error fetching place details:', err);
      setError(err.message || t('places.loadError') || 'Failed to load place details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (place) {
      navigation.navigate('EditPlace' as never, { placeId: place.id } as never);
    }
  };

  const handleManageServices = () => {
    if (place) {
      navigation.navigate('ServicesManagement' as never, { placeId: place.id } as never);
    }
  };

  const handleCall = () => {
    if (place?.telefone) {
      Linking.openURL(`tel:${place.telefone}`);
    }
  };

  const handleEmail = () => {
    if (place?.email) {
      Linking.openURL(`mailto:${place.email}`);
    }
  };

  const handleWebsite = () => {
    if (place?.website) {
      const url = place.website.startsWith('http') ? place.website : `https://${place.website}`;
      Linking.openURL(url);
    }
  };

  const formatAddress = () => {
    if (!place) return '';
    const parts = [];
    if (place.rua) parts.push(place.rua);
    if (place.porta) parts.push(place.porta);
    if (place.cod_postal) parts.push(place.cod_postal);
    if (place.cidade) parts.push(place.cidade);
    if (place.regiao) parts.push(place.regiao);
    return parts.join(', ') || t('places.noAddress') || 'No address provided';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('places.placeDetails') || 'Place Details'}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
        </View>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('places.placeDetails') || 'Place Details'}</Text>
          <View style={styles.headerRight} />
        </View>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error || t('places.notFound') || 'Place not found'}</Text>
          <Button
            title={t('common.goBack') || 'Go Back'}
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.backButton}
          />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{place.nome}</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Images Section */}
      {place.images && place.images.length > 0 && (
        <View style={styles.imagesSection}>
          {place.images.map((image, index) => {
            const imageUrl = getImageUrl(image.image_url);
            return (
              <View key={image.id} style={styles.imageContainer}>
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.fullWidthImage}
                  contentFit="cover"
                />
                {image.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>
                      {t('places.primary') || 'Primary'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          {place.is_active !== false ? (
            <View style={styles.activeBadge}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.activeBadgeText}>
                {t('places.active') || 'Active'}
              </Text>
            </View>
          ) : (
            <View style={styles.inactiveBadge}>
              <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.placeholderLight} />
              <Text style={styles.inactiveBadgeText}>
                {t('places.inactive') || 'Inactive'}
              </Text>
            </View>
          )}
          {place.booking_enabled && (
            <View style={styles.bookingBadge}>
              <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.primary} />
              <Text style={styles.bookingBadgeText}>
                {t('places.bookingEnabled') || 'Booking Enabled'}
              </Text>
            </View>
          )}
        </View>

        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('places.basicInformation') || 'Basic Information'}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('places.name') || 'Name'}</Text>
            <Text style={styles.infoValue}>{place.nome}</Text>
          </View>

          {place.tipo && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.type') || 'Type'}</Text>
              <Text style={styles.infoValue}>{place.tipo}</Text>
            </View>
          )}

          {place.about && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.description') || 'Description'}</Text>
              <Text style={styles.infoValue}>{place.about}</Text>
            </View>
          )}
        </Card>

        {/* Location Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('places.location') || 'Location'}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('places.address') || 'Address'}</Text>
            <Text style={styles.infoValue}>{formatAddress()}</Text>
          </View>

          {place.cidade && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.city') || 'City'}</Text>
              <Text style={styles.infoValue}>{place.cidade}</Text>
            </View>
          )}

          {place.regiao && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.region') || 'Region'}</Text>
              <Text style={styles.infoValue}>{place.regiao}</Text>
            </View>
          )}

          {place.cod_postal && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.postalCode') || 'Postal Code'}</Text>
              <Text style={styles.infoValue}>{place.cod_postal}</Text>
            </View>
          )}

          {place.location_type && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.locationType') || 'Location Type'}</Text>
              <Text style={styles.infoValue}>
                {place.location_type === 'fixed' 
                  ? t('places.fixedLocation') || 'Fixed Location'
                  : t('places.mobileLocation') || 'Mobile Location'}
              </Text>
            </View>
          )}

          {place.coverage_radius && place.location_type === 'mobile' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.coverageRadius') || 'Coverage Radius'}</Text>
              <Text style={styles.infoValue}>{place.coverage_radius} km</Text>
            </View>
          )}
        </Card>

        {/* Map Location */}
        {place.latitude && place.longitude && (
          <>
            <View style={styles.mapSection}>
              <Text style={styles.mapSectionTitle}>
                {t('places.locationOnMap') || 'Location on Map'}
              </Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: place.latitude,
                    longitude: place.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                >
                  <Marker
                    coordinate={{
                      latitude: place.latitude,
                      longitude: place.longitude,
                    }}
                    title={place.nome}
                  />
                </MapView>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => {
                    const url = `https://maps.google.com/?q=${place.latitude},${place.longitude}`;
                    Linking.openURL(url);
                  }}
                >
                  <MaterialCommunityIcons name="open-in-new" size={20} color={theme.colors.primary} />
                  <Text style={styles.mapButtonText}>
                    {t('places.openInMaps') || 'Open in Maps'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Card style={styles.sectionCard}>
              <View style={styles.coordinatesInfo}>
                <Text style={styles.coordinatesLabel}>
                  {t('places.latitude') || 'Latitude'}: {place.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinatesLabel}>
                  {t('places.longitude') || 'Longitude'}: {place.longitude.toFixed(6)}
                </Text>
              </View>
            </Card>
          </>
        )}

        {/* Contact Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('places.contactInformation') || 'Contact Information'}
          </Text>
          
          {place.telefone && (
            <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{place.telefone}</Text>
            </TouchableOpacity>
          )}

          {place.email && (
            <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
              <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{place.email}</Text>
            </TouchableOpacity>
          )}

          {place.website && (
            <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
              <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{place.website}</Text>
            </TouchableOpacity>
          )}

          {place.instagram && (
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="instagram" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>@{place.instagram}</Text>
            </View>
          )}
        </Card>

        {/* Additional Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('places.additionalInformation') || 'Additional Information'}
          </Text>
          
          {place.nif && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.nif') || 'NIF'}</Text>
              <Text style={styles.infoValue}>{place.nif}</Text>
            </View>
          )}

          {place.is_bio_diamond !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.bioDiamond') || 'Bio Diamond'}</Text>
              <Text style={styles.infoValue}>
                {place.is_bio_diamond 
                  ? t('common.yes') || 'Yes'
                  : t('common.no') || 'No'}
              </Text>
            </View>
          )}

          {place.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('places.createdAt') || 'Created At'}</Text>
              <Text style={styles.infoValue}>
                {new Date(place.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Services Count */}
        {place.services !== undefined && (
          <Card style={styles.sectionCard}>
            <View style={styles.servicesHeader}>
              <Text style={styles.sectionTitle}>
                {t('places.services') || 'Services'}
              </Text>
              <Text style={styles.servicesCount}>
                {place.services.length} {t('places.servicesCount') || 'services'}
              </Text>
            </View>
            {place.services.length > 0 && (
              <Button
                title={t('places.manageServices') || 'Manage Services'}
                onPress={handleManageServices}
                variant="outline"
                size="md"
                style={styles.manageButton}
              />
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title={t('places.editPlace') || 'Edit Place'}
            onPress={handleEdit}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
          {place.services && place.services.length > 0 && (
            <Button
              title={t('places.manageServices') || 'Manage Services'}
              onPress={handleManageServices}
              variant="outline"
              size="lg"
              style={styles.actionButton}
            />
          )}
        </View>
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
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'left',
    textAlignVertical: 'center',
    marginLeft: theme.spacing.sm,
    includeFontPadding: false,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
  },
  errorCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  imagesSection: {
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  fullWidthImage: {
    width: Dimensions.get('window').width,
    height: 250,
    backgroundColor: theme.colors.borderLight,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  primaryBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold as any,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  activeBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#10b981',
  },
  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.placeholderLight}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  inactiveBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.placeholderLight,
  },
  bookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  bookingBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  servicesCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  manageButton: {
    marginTop: theme.spacing.sm,
  },
  actionButtons: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  mapSection: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  mapSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  mapContainer: {
    overflow: 'hidden',
  },
  map: {
    width: Dimensions.get('window').width,
    height: 250,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.xs,
  },
  mapButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  coordinatesInfo: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
  },
  coordinatesLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
});

export default PlaceDetailsScreen;

