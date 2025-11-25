import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Platform, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { placeAPI, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import SearchBar from '../../components/common/SearchBar';
import PlaceCard from '../../components/common/PlaceCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  
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

  const categories = [
    { id: 'all', name: t('common.all') || 'All', icon: 'view-grid', color: theme.colors.primary },
    { id: 'beauty', name: t('home.beauty') || 'Beauty', icon: 'lipstick', color: '#E91E63' }, // Pink
    { id: 'wellness', name: t('home.wellness') || 'Wellness', icon: 'spa', color: '#10B981' }, // Emerald
    { id: 'fitness', name: t('home.fitness') || 'Fitness', icon: 'dumbbell', color: '#F59E0B' }, // Amber
    { id: 'food', name: t('home.food') || 'Food & Drink', icon: 'food', color: '#EF4444' }, // Red
  ];

  const handleCategoryPress = (category: any) => {
    if (category.id === 'all') {
      navigation.navigate('Search' as never);
    } else {
      navigation.navigate('Search' as never, { tipo: category.name } as never);
    }
  };

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
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Content */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerBranding}>
              <Logo width={32} height={32} color="#FFFFFF" animated={false} />
              <Text style={styles.headerTitle}>Linkuup</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              {t('home.goodMorning') || 'Good morning,'} {user?.name?.split(' ')[0] || 'Guest'}!
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <SearchBar
              placeholder={t('nav.searchPlaceholder') || 'Find services near you...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={handleSearch}
              onFocus={() => navigation.navigate('Search' as never)}
              style={styles.searchBar}
            />
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>{t('home.categories') || 'Categories'}</Text>
            <View style={styles.categoriesRow}>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(cat)}
                >
                  <View style={[
                    styles.categoryIconContainer, 
                    { backgroundColor: theme.colors.backgroundLight }
                  ]}>
                    <MaterialCommunityIcons 
                      name={cat.icon as any} 
                      size={24} 
                      color={theme.colors.textLight}
                    />
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Popular Near You */}
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitleLarge}>{t('home.popularNearYou') || 'Popular Near You'}</Text>
          
          {isLoading ? (
            <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
          ) : featuredPlaces.length > 0 ? (
            <View>
              {featuredPlaces.map((place) => (
                <PlaceCard 
                  key={place.id} 
                  place={place} 
                  onPress={() => handlePlacePress(place)} 
                  variant="large"
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {t('home.noBusinessesFound') || 'No businesses found nearby.'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 80 }} />
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
    height: 240,
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
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
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  welcomeContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  searchWrapper: {
    marginBottom: theme.spacing.lg,
  },
  searchBar: {
    // Override styles if needed, SearchBar component might need adjustment to be fully custom
    // Assuming SearchBar component is flexible
  },
  categoriesSection: {
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryItem: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    width: '18%', // 5 items -> roughly 20% each
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: 10,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  popularSection: {
    padding: theme.spacing.lg,
  },
  sectionTitleLarge: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    color: theme.colors.placeholderLight,
  },
});

export default HomeScreen;
