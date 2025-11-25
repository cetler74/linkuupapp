import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, StatusBar, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker } from 'react-native-maps';
import { placeAPI, type Place, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

const PlaceDetailsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { placeId, slug } = (route.params as any) || {};
  
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId, slug]);

  const fetchPlaceDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get place by slug first, then by ID
      let placeData;
      if (slug) {
        try {
          placeData = await placeAPI.getPlace(slug);
        } catch (e) {
          // If slug fails, try with ID
          placeData = await placeAPI.getPlace(placeId?.toString() || '');
        }
      } else if (placeId) {
        placeData = await placeAPI.getPlace(placeId.toString());
      } else {
        throw new Error('No place ID or slug provided');
      }
      
      setPlace(placeData);
    } catch (err: any) {
      console.error('Error fetching place details:', err);
      setError(err.message || t('business.notFound') || 'Place not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = () => {
    if (place) {
      navigation.navigate('ServiceSelection' as never, { 
        placeId: place.id, 
        placeName: place.nome 
      } as never);
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

  const handleInstagram = () => {
    if (place?.instagram) {
      const instagramUrl = place.instagram.startsWith('http') 
        ? place.instagram 
        : place.instagram.startsWith('@') 
          ? `https://instagram.com/${place.instagram.substring(1)}`
          : `https://instagram.com/${place.instagram}`;
      Linking.openURL(instagramUrl);
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
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.headerBackground}>
          <View style={styles.headerCurve} />
        </View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerBranding}>
            <Logo width={28} height={28} color="#FFFFFF" animated={false} />
            <Text style={styles.headerTitle}>Linkuup</Text>
          </View>
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
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.headerBackground}>
          <View style={styles.headerCurve} />
        </View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerBranding}>
            <Logo width={28} height={28} color="#FFFFFF" animated={false} />
            <Text style={styles.headerTitle}>Linkuup</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error || t('business.notFound') || 'Place not found'}</Text>
          <Button
            title={t('business.backToSearch') || 'Back to Search'}
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.backButton}
          />
        </Card>
      </View>
    );
  }

  const primaryImage = place.images && place.images.length > 0 && place.images[0].image_url
    ? getImageUrl(place.images[0].image_url)
    : null;
  const hasMultipleImages = place.images && place.images.length > 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerBranding}>
            <Logo width={28} height={28} color="#FFFFFF" animated={false} />
            <Text style={styles.headerTitle}>Linkuup</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Hero Image with Gradient Overlay */}
        <View style={styles.heroImageContainer}>
          {primaryImage ? (
            <Image 
              source={{ uri: primaryImage }} 
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <MaterialCommunityIcons name="image-off" size={48} color={theme.colors.placeholderLight} />
            </View>
          )}
          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />
          
          {/* Image Gallery Indicator */}
          {hasMultipleImages && (
            <View style={styles.imageIndicator}>
              <MaterialCommunityIcons name="image-multiple" size={16} color="#FFFFFF" />
              <Text style={styles.imageIndicatorText}>
                {place.images?.length} {t('business.images') || 'images'}
              </Text>
            </View>
          )}

          {/* Rating Pill Overlay */}
          {place.reviews?.average_rating && (
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingPillText}>
                {place.reviews.average_rating.toFixed(1)}
                {place.reviews.total_reviews > 0 ? ` (${place.reviews.total_reviews})` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.placeName}>{place.nome}</Text>
              {place.is_bio_diamond && (
                <View style={styles.bioDiamondBadge}>
                  <MaterialCommunityIcons name="diamond" size={16} color="#FFD700" />
                  <Text style={styles.bioDiamondText}>BIO</Text>
                </View>
              )}
            </View>
            
            {/* Category Pill */}
            {place.tipo && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{place.tipo.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Meta Information */}
          <View style={styles.metaSection}>
            {place.cidade && (
              <View style={styles.metaItem}>
                <View style={styles.metaIconContainer}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.metaText}>
                  {place.cidade}{place.regiao ? `, ${place.regiao}` : ''}
                </Text>
              </View>
            )}
            {place.location_type === 'mobile' && place.coverage_radius && (
              <View style={styles.metaItem}>
                <View style={styles.metaIconContainer}>
                  <MaterialCommunityIcons name="car" size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.metaText}>
                  {place.coverage_radius}km {t('business.radius') || 'radius'}
                </Text>
              </View>
            )}
          </View>

          {/* About */}
          {place.about && (
            <Card style={styles.sectionCard} variant="elevated">
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>{t('business.about') || 'About'}</Text>
              </View>
              <Text style={styles.aboutText}>{place.about}</Text>
            </Card>
          )}

          {/* Services */}
          {place.services && place.services.length > 0 && (
            <Card style={styles.sectionCard} variant="elevated">
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="format-list-bulleted" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>{t('business.services') || 'Services'}</Text>
              </View>
              <View style={styles.servicesList}>
                {place.services.map((service, index) => (
                  <View key={service.id} style={[
                    styles.serviceItem,
                    index < place.services!.length - 1 && styles.serviceItemBorder
                  ]}>
                    <View style={styles.serviceInfo}>
                      <View style={styles.serviceIconContainer}>
                        <MaterialCommunityIcons 
                          name="scissors-cutting" 
                          size={18} 
                          color={theme.colors.primary} 
                        />
                      </View>
                      <View style={styles.serviceDetails}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        {service.description && (
                          <Text style={styles.serviceDescription} numberOfLines={2}>
                            {service.description}
                          </Text>
                        )}
                        <View style={styles.serviceMeta}>
                          {service.duration && (
                            <View style={styles.serviceMetaItem}>
                              <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.placeholderLight} />
                              <Text style={styles.serviceMetaText}>{service.duration} min</Text>
                            </View>
                          )}
                          {service.is_bio_diamond && (
                            <View style={styles.serviceMetaItem}>
                              <MaterialCommunityIcons name="diamond" size={14} color="#FFD700" />
                              <Text style={[styles.serviceMetaText, styles.bioText]}>BIO</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    {service.price && (
                      <View style={styles.servicePriceContainer}>
                        <Text style={styles.servicePrice}>{service.price.toFixed(2)}€</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Location */}
          <Card style={styles.sectionCard} variant="elevated">
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="map" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>{t('business.location') || 'Location'}</Text>
            </View>
            {(() => {
              const address = formatAddress();
              return address ? (
                <View style={styles.addressContainer}>
                  <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.placeholderLight} />
                  <Text style={styles.addressText}>{address}</Text>
                </View>
              ) : (
                <Text style={styles.noInfoText}>{t('business.locationMapNotAvailable') || 'Location not available'}</Text>
              );
            })()}
            {place.latitude && place.longitude && (
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
                  <MaterialCommunityIcons name="open-in-new" size={18} color={theme.colors.primary} />
                  <Text style={styles.mapButtonText}>
                    {t('business.openInMaps') || 'Open in Maps'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Contact */}
          <Card style={styles.sectionCard} variant="elevated">
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>{t('business.contact') || 'Contact'}</Text>
            </View>
            <View style={styles.contactSection}>
              {place.telefone && (
                <TouchableOpacity style={styles.contactButton} onPress={handleCall} activeOpacity={0.7}>
                  <View style={[styles.contactIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialCommunityIcons name="phone" size={22} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.contactText}>{place.telefone}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.placeholderLight} />
                </TouchableOpacity>
              )}
              {place.email && (
                <TouchableOpacity style={styles.contactButton} onPress={handleEmail} activeOpacity={0.7}>
                  <View style={[styles.contactIconContainer, { backgroundColor: '#F3E5F5' }]}>
                    <MaterialCommunityIcons name="email" size={22} color="#9C27B0" />
                  </View>
                  <Text style={styles.contactText}>{place.email}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.placeholderLight} />
                </TouchableOpacity>
              )}
              {place.website && (
                <TouchableOpacity style={styles.contactButton} onPress={handleWebsite} activeOpacity={0.7}>
                  <View style={[styles.contactIconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialCommunityIcons name="web" size={22} color="#4CAF50" />
                  </View>
                  <Text style={styles.contactText}>{t('business.visitWebsite') || 'Visit Website'}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.placeholderLight} />
                </TouchableOpacity>
              )}
              {place.instagram && (
                <TouchableOpacity style={styles.contactButton} onPress={handleInstagram} activeOpacity={0.7}>
                  <View style={[styles.contactIconContainer, { backgroundColor: '#FCE4EC' }]}>
                    <MaterialCommunityIcons name="instagram" size={22} color="#E91E63" />
                  </View>
                  <Text style={styles.contactText}>
                    {place.instagram.startsWith('@') ? place.instagram : `@${place.instagram}`}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.placeholderLight} />
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Book Now Button */}
          {place.booking_enabled && (
            <View style={styles.bookButtonContainer}>
              <Button
                title={t('business.bookNow') || 'Book Now'}
                onPress={handleBookNow}
                variant="primary"
                size="lg"
                style={styles.bookButton}
              />
            </View>
          )}
        </View>
      </ScrollView>
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
    zIndex: 0,
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
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: 100,
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
    marginTop: 100,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  heroImageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    marginTop: -20,
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.borderLight,
  },
  heroImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.borderLight,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageIndicator: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  imageIndicatorText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.medium,
  },
  ratingPill: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    ...theme.shadows.md,
  },
  ratingPillText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  titleSection: {
    marginBottom: theme.spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  placeName: {
    flex: 1,
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginRight: theme.spacing.sm,
  },
  bioDiamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  bioDiamondText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#B8860B',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  categoryPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  metaSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  aboutText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    lineHeight: 24,
  },
  servicesList: {
    gap: 0,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  serviceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  serviceInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.md,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDetails: {
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
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  serviceMetaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  bioText: {
    color: '#B8860B',
    fontWeight: theme.typography.fontWeight.medium,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  addressText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  noInfoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    fontStyle: 'italic',
  },
  mapContainer: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  map: {
    width: '100%',
    height: 200,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  mapButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  contactSection: {
    gap: theme.spacing.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bookButtonContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  bookButton: {
    width: '100%',
    ...theme.shadows.lg,
  },
});

export default PlaceDetailsScreen;
