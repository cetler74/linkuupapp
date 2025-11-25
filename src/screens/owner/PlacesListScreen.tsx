import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type Place, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('places.myPlaces') || 'Places'}
          </Text>
        </View>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons
              name="office-building-outline"
              size={64}
              color={theme.colors.primary}
            />
          </View>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={[theme.colors.primary]}
            />
          }
        >
          {places.map((place) => {
            const firstImage = place.images && place.images.length > 0 ? place.images[0] : null;
            const rawImageUrl = firstImage?.image_url;
            const imageUrl = rawImageUrl && rawImageUrl.trim() !== ''
              ? getImageUrl(rawImageUrl)
              : null;
            const hasValidImage = imageUrl && imageUrl.trim() !== '';

            return (
              <TouchableOpacity
                key={place.id}
                onPress={() => handlePlacePress(place)}
                activeOpacity={0.9}
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
                          size={40}
                          color={theme.colors.placeholderLight}
                        />
                      </View>
                    )}
                    <View style={styles.placeInfoContainer}>
                      <View style={styles.placeHeader}>
                        <View style={styles.placeInfo}>
                          <Text style={styles.placeName} numberOfLines={1}>{place.nome}</Text>
                          <Text style={styles.placeType} numberOfLines={1}>{place.tipo}</Text>
                        </View>
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

                      <View style={styles.placeDetails}>
                        {place.cidade && (
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={16}
                              color={theme.colors.placeholderLight}
                            />
                            <Text style={styles.detailText} numberOfLines={1}>{place.cidade}</Text>
                          </View>
                        )}

                        <View style={styles.statusRow}>
                          <View style={[styles.statusBadge, place.is_active !== false ? styles.activeBadge : styles.inactiveBadge]}>
                            <Text style={[styles.statusText, place.is_active !== false ? styles.activeText : styles.inactiveText]}>
                              {place.is_active !== false ? (t('places.active') || 'Active') : (t('places.inactive') || 'Inactive')}
                            </Text>
                          </View>

                          {place.booking_enabled !== undefined && (
                            <View style={[styles.statusBadge, place.booking_enabled ? styles.bookingEnabledBadge : styles.bookingDisabledBadge]}>
                              <MaterialCommunityIcons
                                name={place.booking_enabled ? 'calendar-check' : 'calendar-remove'}
                                size={12}
                                color={place.booking_enabled ? theme.colors.success : theme.colors.placeholderLight}
                                style={{ marginRight: 4 }}
                              />
                              <Text style={[styles.statusText, place.booking_enabled ? styles.bookingEnabledText : styles.bookingDisabledText]}>
                                {place.booking_enabled ? 'Bookings' : 'No Bookings'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPlace}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  placesList: {
    flex: 1,
  },
  placesListContent: {
    padding: theme.spacing.lg,
    paddingBottom: 80, // Space for FAB
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
  placeCard: {
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    padding: 0,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 0,
    ...theme.shadows.md,
  },
  placeContent: {
    flexDirection: 'column',
  },
  placeThumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.borderLight,
  },
  placeThumbnailPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfoContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  placeInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.full,
  },
  placeName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  placeType: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
  placeDetails: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  activeBadge: {
    backgroundColor: `${theme.colors.success}15`,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.borderLight,
  },
  bookingEnabledBadge: {
    backgroundColor: `${theme.colors.info}15`,
  },
  bookingDisabledBadge: {
    backgroundColor: theme.colors.borderLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
  },
  activeText: {
    color: theme.colors.success,
  },
  inactiveText: {
    color: theme.colors.placeholderLight,
  },
  bookingEnabledText: {
    color: theme.colors.info,
  },
  bookingDisabledText: {
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
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 200,
  },
});

export default PlacesListScreen;
