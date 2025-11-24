import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { placeAPI, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import SearchBar from '../../components/common/SearchBar';
import PlaceCard from '../../components/common/PlaceCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Logo from '../../components/common/Logo';

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeaturedPlaces();
  }, []);

  const fetchFeaturedPlaces = async () => {
    try {
      setIsLoading(true);
      const response = await placeAPI.getPlaces({}, 1, 10);
      const places = Array.isArray(response) ? response : response.places || [];
      setFeaturedPlaces(places);
    } catch (error) {
      console.error('Error fetching featured places:', error);
      setFeaturedPlaces([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search' as never, { query: searchQuery } as never);
    }
  };

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetails' as never, { placeId: place.id, slug: place.slug } as never);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeaturedPlaces();
  };

  const keyHighlights = [
    {
      icon: '📅',
      title: t('home.flexibleBookingSystem'),
      description: t('home.flexibleBookingDesc'),
      color: theme.colors.primary,
    },
    {
      icon: '💳',
      title: t('home.instantPayments'),
      description: t('home.instantPaymentsDesc'),
      color: '#10b981',
    },
    {
      icon: '🔄',
      title: t('home.realtimeSync'),
      description: t('home.realtimeSyncDesc'),
      color: theme.colors.secondary,
    },
  ];

  const serviceCategories = [
    { icon: '💇', name: t('home.beauty') || 'Beauty' },
    { icon: '💆', name: t('home.wellness') || 'Wellness' },
    { icon: '💪', name: t('home.fitness') || 'Fitness' },
    { icon: '🏥', name: t('home.medical') || 'Medical' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('nav.home') || 'Home'}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder={t('nav.searchPlaceholder') || 'Search for services or businesses'}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={handleSearch}
        onFocus={() => navigation.navigate('Search' as never)}
      />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>{t('home.heroTitle') || 'Discover the best professionals'}</Text>
        <Text style={styles.heroSubtitle}>
          {t('home.heroSubtitle') || 'Beauty | Wellness | Style'}
        </Text>
        <Text style={styles.heroDescription}>
          {t('home.heroDescription') || 'Book fast and easy'}
        </Text>
        <View style={styles.heroButtons}>
          <Button
            title={t('home.getStartedToday') || 'Get Started'}
            onPress={() => navigation.navigate('Search' as never)}
            variant="primary"
            size="md"
            style={styles.heroButton}
          />
        </View>
      </View>

      {/* Service Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.exploreServices') || 'Explore Services'}</Text>
        <View style={styles.categoriesContainer}>
          {serviceCategories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Search' as never, { tipo: category.name } as never)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Businesses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('home.featuredBusinesses') || 'Featured Businesses'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search' as never)}>
            <Text style={styles.seeAllText}>{t('common.seeAll') || 'See All'}</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
        ) : featuredPlaces.length > 0 ? (
          <FlatList
            data={featuredPlaces}
            renderItem={({ item }) => (
              <PlaceCard place={item} onPress={() => handlePlacePress(item)} />
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.placesList}
          />
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('home.noBusinessesFound') || 'No businesses found'}
            </Text>
          </Card>
        )}
      </View>

      {/* Key Highlights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('home.everythingYouNeed') || 'Everything You Need'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {t('home.featuresSubtitle') || 'Discover what makes us different'}
        </Text>
        {keyHighlights.map((highlight, index) => (
          <Card key={index} style={styles.highlightCard}>
            <View style={styles.highlightContent}>
              <View style={[styles.highlightIcon, { backgroundColor: highlight.color }]}>
                <Text style={styles.highlightIconText}>{highlight.icon}</Text>
              </View>
              <View style={styles.highlightText}>
                <Text style={styles.highlightTitle}>{highlight.title}</Text>
                <Text style={styles.highlightDescription}>{highlight.description}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Card style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>
            {t('home.startFreeTrial') || 'Start Your Free Trial'}
          </Text>
          <Text style={styles.ctaDescription}>
            {t('home.startFreeTrialDesc') || 'Join thousands of businesses using LinkUup'}
          </Text>
          <Button
            title={t('home.startFreeTrialButton') || 'Get Started Free'}
            onPress={() => navigation.navigate('Register' as never)}
            variant="primary"
            size="lg"
            style={styles.ctaButton}
          />
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
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
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
  heroSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.xl,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  heroDescription: {
    fontSize: theme.typography.fontSize.base,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: theme.spacing.md,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  heroButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  categoryCard: {
    width: '23%',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  placesList: {
    paddingRight: theme.spacing.md,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
  highlightCard: {
    marginBottom: theme.spacing.md,
  },
  highlightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  highlightIconText: {
    fontSize: 24,
  },
  highlightText: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  highlightDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  ctaSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  ctaCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
  },
});

export default HomeScreen;
