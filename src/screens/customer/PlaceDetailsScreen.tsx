import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker } from 'react-native-maps';
import { placeAPI, type Place, getImageUrl } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('business.about') || 'Place Details'}</Text>
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
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('business.about') || 'Place Details'}</Text>
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{place.nome}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Image */}
      {primaryImage && (
        <Image 
          source={{ uri: primaryImage }} 
          style={styles.heroImage}
          resizeMode="cover"
        />
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Name and Rating */}
        <View style={styles.titleSection}>
          <Text style={styles.placeName}>{place.nome}</Text>
          {place.reviews?.average_rating && (
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <Text style={styles.rating}>
                {place.reviews.average_rating.toFixed(1)}
                {place.reviews.total_reviews > 0 && ` (${place.reviews.total_reviews})`}
              </Text>
            </View>
          )}
        </View>

        {/* Type and Location */}
        <View style={styles.metaSection}>
          {place.tipo && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="tag" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>{place.tipo}</Text>
            </View>
          )}
          {place.cidade && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>{place.cidade}{place.regiao ? `, ${place.regiao}` : ''}</Text>
            </View>
          )}
        </View>

        {/* About */}
        {place.about && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('business.about') || 'About'}</Text>
            <Text style={styles.aboutText}>{place.about}</Text>
          </Card>
        )}

        {/* Location */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('business.location') || 'Location'}</Text>
          {formatAddress() ? (
            <Text style={styles.addressText}>{formatAddress()}</Text>
          ) : (
            <Text style={styles.noInfoText}>{t('business.locationMapNotAvailable') || 'Location not available'}</Text>
          )}
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
                <MaterialCommunityIcons name="open-in-new" size={20} color={theme.colors.primary} />
                <Text style={styles.mapButtonText}>
                  {t('business.openInMaps') || 'Open in Maps'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Services */}
        {place.services && place.services.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('business.services') || 'Services'}</Text>
            {place.services.map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.price && (
                  <Text style={styles.servicePrice}>
                    {service.price.toFixed(2)}€
                    {service.duration && ` • ${service.duration} min`}
                  </Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Contact */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('business.contact') || 'Contact'}</Text>
          <View style={styles.contactSection}>
            {place.telefone && (
              <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText}>{place.telefone}</Text>
              </TouchableOpacity>
            )}
            {place.email && (
              <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
                <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText}>{place.email}</Text>
              </TouchableOpacity>
            )}
            {place.website && (
              <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
                <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText}>{t('business.visitWebsite') || 'Visit Website'}</Text>
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
  backButtonText: {
    fontSize: 24,
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
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: theme.colors.borderLight,
  },
  content: {
    padding: theme.spacing.md,
  },
  titleSection: {
    marginBottom: theme.spacing.md,
  },
  placeName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  rating: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  metaSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  metaText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginLeft: theme.spacing.xs,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  aboutText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  addressText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
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
  },
  map: {
    width: '100%',
    height: 200,
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
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  serviceName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    flex: 1,
  },
  servicePrice: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  contactSection: {
    gap: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  bookButtonContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  bookButton: {
    width: '100%',
  },
});

export default PlaceDetailsScreen;

