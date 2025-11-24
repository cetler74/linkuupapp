import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type PlaceEmployee, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getImageUrl } from '../../api/api';

const EmployeesManagementScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId: routePlaceId } = (route.params as any) || {};
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(routePlaceId || null);
  const [place, setPlace] = useState<Place | null>(null);
  const [employees, setEmployees] = useState<PlaceEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchPlace();
      fetchEmployees();
    }
  }, [selectedPlaceId]);

  // Refresh employees when screen comes into focus (after form submission)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedPlaceId) {
        fetchEmployees();
      }
    });
    return unsubscribe;
  }, [navigation, selectedPlaceId]);

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

  const fetchPlace = async () => {
    if (!selectedPlaceId) return;
    try {
      const places = await ownerAPI.getOwnerPlaces();
      const foundPlace = places.find(p => p.id === selectedPlaceId);
      setPlace(foundPlace || null);
    } catch (error) {
      console.error('Error fetching place:', error);
    }
  };

  const fetchEmployees = async () => {
    if (!selectedPlaceId) return;
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceEmployees(selectedPlaceId);
      setEmployees(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };


  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const handleAdd = () => {
    if (!selectedPlaceId) {
      Alert.alert(t('common.error') || 'Error', t('employees.selectPlaceFirst') || 'Please select a place first');
      return;
    }
    navigation.navigate('EmployeeForm' as never, {
      placeId: selectedPlaceId,
    } as never);
  };

  const handleEdit = (employee: PlaceEmployee) => {
    navigation.navigate('EmployeeForm' as never, {
      placeId: selectedPlaceId,
      employeeId: employee.id,
    } as never);
  };

  const handleDelete = async (employeeId: number) => {
    Alert.alert(
      t('common.confirmDelete') || 'Confirm Delete',
      t('employees.confirmDeleteMessage') || 'Are you sure you want to delete this employee?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerAPI.deleteEmployee(employeeId);
              fetchEmployees();
            } catch (error) {
              console.error('Error deleting employee:', error);
              Alert.alert(t('common.error') || 'Error', t('employees.deleteError') || 'Failed to delete employee');
            }
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('employees.manageEmployees') || 'Manage Employees'}
        </Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Place Selector */}
      {places.length > 1 && (
        <View style={styles.placeSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.placeSelector}
            contentContainerStyle={styles.placeSelectorContent}
          >
            {places.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.placeChip,
                  selectedPlaceId === p.id && styles.placeChipActive,
                ]}
                onPress={() => setSelectedPlaceId(p.id)}
              >
                <Text
                  style={[
                    styles.placeChipText,
                    selectedPlaceId === p.id && styles.placeChipTextActive,
                  ]}
                >
                  {p.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {place && (
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{place.nome}</Text>
          <Text style={styles.placeLocation}>{place.cidade}</Text>
        </View>
      )}

      {/* Employees List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : employees.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <MaterialCommunityIcons
            name="account-group"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyTitle}>
            {t('employees.noEmployees') || 'No Employees Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {t('employees.addFirstEmployee') || 'Add your first employee to get started'}
          </Text>
          <Button
            title={t('employees.addEmployee') || 'Add Employee'}
            onPress={handleAdd}
            variant="primary"
            size="lg"
            style={styles.emptyButton}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.employeesList}
          contentContainerStyle={styles.employeesListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {employees.map((employee) => {
            const avatarUrl = employee.photo_url ? getImageUrl(employee.photo_url) : null;
            
            return (
              <Card key={employee.id} style={styles.employeeCard}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EmployeeDetail' as never, {
                    employeeId: employee.id,
                    placeId: selectedPlaceId,
                  } as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.employeeHeader}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.employeeAvatar} />
                    ) : (
                      <View style={styles.employeeAvatar}>
                        <Text style={styles.employeeInitials}>
                          {employee.name[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{employee.name}</Text>
                      {employee.role && (
                        <Text style={styles.employeeRole}>{employee.role}</Text>
                      )}
                      {employee.specialty && (
                        <Text style={styles.employeeSpecialty}>{employee.specialty}</Text>
                      )}
                      {employee.email && (
                        <Text style={styles.employeeEmail}>{employee.email}</Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color={theme.colors.placeholderLight}
                    />
                  </View>
                </TouchableOpacity>
              </Card>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  placeSelectorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  placeSelector: {
    maxHeight: 60,
  },
  placeSelectorContent: {
    gap: theme.spacing.sm,
  },
  placeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginRight: theme.spacing.sm,
  },
  placeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  placeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  placeChipTextActive: {
    color: '#FFFFFF',
  },
  placeInfo: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}10`,
  },
  placeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  placeLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.xs,
  },
  employeesList: {
    flex: 1,
  },
  employeesListContent: {
    padding: theme.spacing.md,
  },
  employeeCard: {
    marginBottom: theme.spacing.md,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  employeeAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitials: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  employeeRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  employeeSpecialty: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  employeeEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  employeeActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
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
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 200,
  },
});

export default EmployeesManagementScreen;

