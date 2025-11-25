import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Place, getImageUrl } from '../../api/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  variant?: 'compact' | 'large';
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress, variant = 'compact' }) => {
  const imageUrl = place.images && place.images.length > 0 && place.images[0].image_url
    ? getImageUrl(place.images[0].image_url) 
    : null;

  if (variant === 'large') {
    return (
      <TouchableOpacity style={styles.largeCard} onPress={onPress} activeOpacity={0.9}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.largeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.largeImage, { backgroundColor: theme.colors.borderLight, justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="image-off" size={40} color={theme.colors.placeholderLight} />
          </View>
        )}
        
        {/* Rating Pill */}
        {place.rating && (
          <View style={styles.ratingPill}>
            <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.largeContent}>
          <Text style={styles.largeName} numberOfLines={1}>{place.nome}</Text>
          
          <View style={styles.row}>
            {place.cidade && (
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.placeholderLight} />
                <Text style={styles.largeLocation} numberOfLines={1}>
                  {place.cidade}
                </Text>
              </View>
            )}
          </View>

          {place.tipo && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{place.tipo.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{place.nome}</Text>
        {place.cidade && (
          <Text style={styles.location} numberOfLines={1}>
            📍 {place.cidade}
          </Text>
        )}
        {place.tipo && (
          <Text style={styles.type} numberOfLines={1}>{place.tipo}</Text>
        )}
        {place.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {place.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Compact styles (existing)
  card: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    marginRight: theme.spacing.md, // Added margin right for horizontal list
    width: 200, // Fixed width for horizontal list
    ...theme.shadows.md,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.borderLight,
  },
  content: {
    padding: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  location: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  type: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Large styles
  largeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24, // Larger radius
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  largeImage: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.borderLight,
  },
  largeContent: {
    padding: theme.spacing.lg,
  },
  largeName: {
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  largeLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...theme.shadows.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  categoryPill: {
    backgroundColor: '#E0E7FF', // Light indigo
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
});

export default PlaceCard;
