import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { placeAPI, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import SearchBar from '../../components/common/SearchBar';
import PlaceCard from '../../components/common/PlaceCard';
import Card from '../../components/ui/Card';

const SearchScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState((route.params as any)?.query || '');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    cidade: (route.params as any)?.cidade || '',
    tipo: (route.params as any)?.tipo || '',
    is_bio_diamond: false,
  });
  const [activeFilter, setActiveFilter] = useState<string | null>('nearby');

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await placeAPI.getPlaces({
        search: searchQuery,
        cidade: filters.cidade,
        tipo: filters.tipo,
        is_bio_diamond: filters.is_bio_diamond,
      }, 1, 50);
      
      const places = Array.isArray(results) ? results : results.places || [];
      setSearchResults(places);
    } catch (err) {
      setError(t('search.tryAgain') || 'Please try again');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters, t]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFilterPress = (filterType: string) => {
    setActiveFilter(filterType);
    // Apply filter logic here
    if (filterType === 'top-rated') {
      // Sort by rating
      const sorted = [...searchResults].sort((a, b) => 
        (b.rating || 0) - (a.rating || 0)
      );
      setSearchResults(sorted);
    } else if (filterType === 'nearby') {
      performSearch();
    }
  };

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetails' as never, { placeId: place.id, slug: place.slug } as never);
  };

  const quickFilters = [
    { id: 'nearby', label: t('search.nearby') || 'Nearby' },
    { id: 'top-rated', label: t('search.topRated') || 'Top Rated' },
    { id: 'haircut', label: t('search.haircut') || 'Haircut' },
    { id: 'massage', label: t('search.massage') || 'Massage' },
    { id: 'open-now', label: t('search.openNow') || 'Open Now' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('nav.search') || 'Explore'}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder={t('nav.searchPlaceholder') || 'Search for services or businesses...'}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={performSearch}
      />

      {/* Quick Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={quickFilters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.id && styles.filterChipActive,
              ]}
              onPress={() => handleFilterPress(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {t('search.popularNearby') || 'Popular Nearby'}
        </Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={performSearch} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>{t('common.tryAgain') || 'Try Again'}</Text>
            </TouchableOpacity>
          </Card>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <PlaceCard place={item} onPress={() => handlePlacePress(item)} />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('search.noResults') || 'No results found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {t('search.tryDifferentSearch') || 'Try adjusting your search or filters'}
            </Text>
          </Card>
        )}
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
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.textLight,
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
  filtersContainer: {
    paddingVertical: theme.spacing.sm,
  },
  filtersList: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  resultsTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  resultsList: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
  },
  errorCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
});

export default SearchScreen;
