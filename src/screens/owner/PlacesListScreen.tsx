import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type Place, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const PlacesListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      setIsLoading(true);
      const response = await ownerAPI.getOwnerPlaces();
      const placesArray = Array.isArray(response) ? response : [];
      
      // The list endpoint doesn't include images, so we fetch images separately using the images endpoint
      // Fetch images for all places in parallel
      const placesWithImages = await Promise.all(
        placesArray.map(async (place) => {
          try {
            // Fetch images using the dedicated images endpoint
            const images = await ownerAPI.getPlaceImages(place.id);
            return {
              ...place,
              images: images || [],
            };
          } catch (error) {
            console.error(`Error fetching images for place ${place.id}:`, error);
            // Return place without images if fetch fails
            return {
              ...place,
              images: [],
            };
          }
        })
      );
      
      console.log('📋 Places fetched with images:', placesWithImages.length);
      placesWithImages.forEach((place, index) => {
        console.log(`Place ${index + 1} (${place.nome}):`, {
          id: place.id,
          hasImages: !!place.images,
          imagesCount: place.images?.length || 0,
          firstImageUrl: place.images?.[0]?.image_url || 'none',
        });
      });
      
      setPlaces(placesWithImages);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlaces();
  };

  const handlePlacePress = (place: Place) => {
    // Navigate to place details to view all configured information
    (navigation as any).navigate('PlaceDetails', { placeId: place.id });
  };

  const handleEditPlace = (place: Place) => {
    (navigation as any).navigate('EditPlace', { placeId: place.id });
  };

  const handleAddPlace = () => {
    navigation.navigate('AddPlace' as never);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('places.myPlaces') || 'My Places'}
        </Text>
      </View>

      {/* Places List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : places.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <MaterialCommunityIcons
            name="office-building-outline"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyTitle}>
            {t('places.noPlaces') || 'No Places Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {t('places.addFirstPlace') || 'Add your first business place to get started'}
          </Text>
          <Button
            title={t('places.addPlace') || 'Add Place'}
            onPress={handleAddPlace}
            variant="primary"
            size="lg"
            style={styles.emptyButton}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.placesList}
          contentContainerStyle={styles.placesListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <TouchableOpacity onPress={handleAddPlace} style={styles.addPlaceCard}>
            <MaterialCommunityIcons name="plus-circle" size={32} color={theme.colors.primary} />
            <Text style={styles.addPlaceText}>
              {t('places.addNewPlace') || 'Add New Place'}
            </Text>
          </TouchableOpacity>

          {places.map((place) => {
            const firstImage = place.images && place.images.length > 0 ? place.images[0] : null;
            const rawImageUrl = firstImage?.image_url;
            const imageUrl = rawImageUrl && rawImageUrl.trim() !== '' 
              ? getImageUrl(rawImageUrl) 
              : null;
            const hasValidImage = imageUrl && imageUrl.trim() !== '';

            // Debug logging for image issues
            if (place.nome === 'Nails mall' || !hasValidImage) {
              console.log(`🔍 Image debug for "${place.nome}":`, {
                hasImages: !!place.images,
                imagesLength: place.images?.length || 0,
                firstImage: firstImage,
                rawImageUrl: rawImageUrl,
                imageUrl: imageUrl,
                hasValidImage: hasValidImage,
              });
            }

            return (
              <TouchableOpacity
                key={place.id}
                onPress={() => handlePlacePress(place)}
                activeOpacity={0.7}
              >
                <Card style={styles.placeCard}>
                  <View style={styles.placeContent}>
                    {hasValidImage ? (
                      <Image
                        source={{ uri: imageUrl! }}
                        style={styles.placeThumbnail}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.placeThumbnailPlaceholder}>
                        <MaterialCommunityIcons
                          name="image-outline"
                          size={32}
                          color={theme.colors.placeholderLight}
                        />
                      </View>
                    )}
                    <View style={styles.placeInfoContainer}>
                      <View style={styles.placeHeader}>
                        <View style={styles.placeInfo}>
                          <Text style={styles.placeName}>{place.nome}</Text>
                          <Text style={styles.placeType}>{place.tipo}</Text>
                        </View>
                        <View style={styles.headerRight}>
                          {place.is_active !== false ? (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>
                                {t('places.active') || 'Active'}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.inactiveBadge}>
                              <Text style={styles.inactiveBadgeText}>
                                {t('places.inactive') || 'Inactive'}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => handleEditPlace(place)}
                            style={styles.editButton}
                          >
                            <MaterialCommunityIcons
                              name="pencil"
                              size={20}
                              color={theme.colors.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.placeDetails}>
                        {place.cidade && (
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={16}
                              color={theme.colors.placeholderLight}
                            />
                            <Text style={styles.detailText}>{place.cidade}</Text>
                          </View>
                        )}
                        {place.booking_enabled !== undefined && (
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons
                              name={place.booking_enabled ? 'check-circle' : 'close-circle'}
                              size={16}
                              color={place.booking_enabled ? '#10b981' : theme.colors.placeholderLight}
                            />
                            <Text style={styles.detailText}>
                              {place.booking_enabled
                                ? t('places.bookingEnabled') || 'Booking Enabled'
                                : t('places.bookingDisabled') || 'Booking Disabled'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  placesList: {
    flex: 1,
  },
  placesListContent: {
    padding: theme.spacing.md,
  },
  addPlaceCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginBottom: theme.spacing.md,
  },
  addPlaceText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as '500',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  placeCard: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    padding: 0,
  },
  placeContent: {
    flexDirection: 'row',
    minHeight: 120,
  },
  placeThumbnail: {
    width: 120,
    height: '100%',
    backgroundColor: theme.colors.borderLight,
  } as const,
  placeThumbnailPlaceholder: {
    width: 120,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfoContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  placeInfo: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  placeName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  placeType: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  activeBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  activeBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: `${theme.colors.placeholderLight}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  inactiveBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.placeholderLight,
  },
  placeDetails: {
    gap: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
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
    fontWeight: theme.typography.fontWeight.bold as '700',
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
});

export default PlacesListScreen;
