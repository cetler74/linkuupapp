import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Dimensions, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getImageUrl } from '../../api/api';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

interface Customer {
  id?: number;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  name?: string; // Fallback for full name
  email: string;
  phone?: string;
  total_bookings?: number;
  last_booking_date?: string;
  total_spent?: number;
  rewards_points?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  gdpr_data_processing_consent?: boolean;
  gdpr_marketing_consent?: boolean;
}

const CustomersScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchCustomers();
    }
  }, [selectedPlaceId]);

  // Refresh customers when screen comes into focus (e.g., after adding a customer)
  useFocusEffect(
    React.useCallback(() => {
      if (selectedPlaceId) {
        fetchCustomers();
      }
    }, [selectedPlaceId])
  );

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const fetchPlaces = async () => {
    try {
      const response = await ownerAPI.getOwnerPlaces();
      const placesList = Array.isArray(response) ? response : [];
      setPlaces(placesList);
      if (placesList.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(placesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    }
  };

  const fetchCustomers = async () => {
    if (!selectedPlaceId) return;
    
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceCustomers(selectedPlaceId);
      setCustomers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer => {
      const fullName = customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      return (
        fullName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.first_name?.toLowerCase().includes(query) ||
        customer.last_name?.toLowerCase().includes(query)
      );
    });
    setFilteredCustomers(filtered);
  };

  const getCustomerDisplayName = (customer: Customer): string => {
    if (customer.name) return customer.name;
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    return customer.email;
  };

  const getCustomerInitials = (customer: Customer): string => {
    const name = getCustomerDisplayName(customer);
    if (name && name.length > 0) {
      return name[0].toUpperCase();
    }
    return customer.email[0].toUpperCase();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleCustomerPress = (customer: Customer) => {
    const customerId = customer.user_id || customer.id;
    if (!customerId || !selectedPlaceId) return;
    navigation.navigate('CustomerDetails' as never, { 
      customerId: customerId,
      placeId: selectedPlaceId 
    } as never);
  };

  const handleAddCustomer = () => {
    if (!selectedPlaceId) return;
    navigation.navigate('AddCustomer' as never, { placeId: selectedPlaceId } as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('customers.manageCustomers') || 'Customers'}
          </Text>
        </View>
      </View>

      {/* Place Selector */}
      {places.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.placeSelector}
          contentContainerStyle={styles.placeSelectorContent}
        >
          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={[
                styles.placeChip,
                selectedPlaceId === place.id && styles.placeChipActive,
              ]}
              onPress={() => setSelectedPlaceId(place.id)}
            >
              <Text
                style={[
                  styles.placeChipText,
                  selectedPlaceId === place.id && styles.placeChipTextActive,
                ]}
              >
                {place.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.colors.placeholderLight}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('customers.searchCustomers') || 'Search customers...'}
            placeholderTextColor={theme.colors.placeholderLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Customers List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredCustomers.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <MaterialCommunityIcons
            name="account-group-outline"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? t('customers.noCustomersFound') || 'No customers found'
              : t('customers.noCustomers') || 'No Customers'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? t('customers.tryDifferentSearch') || 'Try a different search term'
              : t('customers.customersWillAppear') || 'Customers will appear here once they make bookings'}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.customersList}
          contentContainerStyle={styles.customersListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              onPress={() => handleCustomerPress(customer)}
              activeOpacity={0.7}
            >
              <Card style={styles.customerCard}>
                <View style={styles.customerHeader}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerInitials}>
                      {getCustomerInitials(customer)}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{getCustomerDisplayName(customer)}</Text>
                    <Text style={styles.customerEmail}>{customer.email}</Text>
                    {customer.phone && (
                      <Text style={styles.customerPhone}>{customer.phone}</Text>
                    )}
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.placeholderLight}
                  />
                </View>
                <View style={styles.customerStats}>
                  {customer.total_bookings !== undefined && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{customer.total_bookings}</Text>
                      <Text style={styles.statLabel}>
                        {t('customers.bookings') || 'Bookings'}
                      </Text>
                    </View>
                  )}
                  {customer.total_spent !== undefined && customer.total_spent !== null && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>€{customer.total_spent.toFixed(2)}</Text>
                      <Text style={styles.statLabel}>
                        {t('customers.totalSpent') || 'Total Spent'}
                      </Text>
                    </View>
                  )}
                  {customer.rewards_points !== undefined && customer.rewards_points !== null && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{customer.rewards_points}</Text>
                      <Text style={styles.statLabel}>
                        {t('customers.rewardsPoints') || 'Rewards Points'}
                      </Text>
                    </View>
                  )}
                  {customer.last_booking_date && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {new Date(customer.last_booking_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.statLabel}>
                        {t('customers.lastBooking') || 'Last Booking'}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {selectedPlaceId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddCustomer}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
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
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
  placeSelectorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  placeSelector: {
    maxHeight: 60,
    borderBottomWidth: 0,
  },
  placeSelectorContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  placeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  placeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  placeChipTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  customersList: {
    flex: 1,
  },
  customersListContent: {
    padding: theme.spacing.md,
  },
  customerCard: {
    marginBottom: theme.spacing.md,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  customerInitials: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  customerEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  customerPhone: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
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
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
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
});

export default CustomersScreen;
