import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Place, getImageUrl } from '../../api/api';

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress }) => {
  const imageUrl = place.images && place.images.length > 0 && place.images[0].image_url
    ? getImageUrl(place.images[0].image_url) 
    : null;

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
  card: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.borderLight,
  },
  content: {
    padding: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  location: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  type: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default PlaceCard;

