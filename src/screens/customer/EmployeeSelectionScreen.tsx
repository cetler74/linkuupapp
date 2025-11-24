import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { placeAPI, type PlaceEmployee } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getImageUrl } from '../../api/api';

const EmployeeSelectionScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { placeId, placeName, selectedServices, totalPrice, totalDuration } = (route.params as any) || {};
  
  const [employees, setEmployees] = useState<PlaceEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, [placeId, selectedServices]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      // Try to get place by ID or slug
      let place;
      try {
        place = await placeAPI.getPlace(placeId.toString());
      } catch (e) {
        // If getPlace fails, try fetching from places list
        const places = await placeAPI.getPlaces({}, 1, 100);
        const placeList = Array.isArray(places) ? places : places.places || [];
        place = placeList.find(p => p.id === placeId);
      }
      if (place) {
        // Get all employees for the place
        // The backend will filter by service availability when checking time slots
        setEmployees(place.employees || []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate('DateTimeSelection' as never, {
      placeId,
      placeName,
      selectedServices,
      selectedEmployee,
      totalPrice,
      totalDuration,
    } as never);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('booking.selectProfessional') || 'Select a Professional'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Employees List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.employeesList} contentContainerStyle={styles.employeesListContent}>
          {/* No Preference Option */}
          <TouchableOpacity
            onPress={() => setSelectedEmployee(null)}
            activeOpacity={0.7}
          >
            <Card style={[styles.employeeCard, selectedEmployee === null && styles.employeeCardSelected]}>
              <View style={styles.employeeContent}>
                <View style={[styles.employeeAvatar, styles.noPreferenceAvatar]}>
                  <Text style={styles.employeeIcon}>👥</Text>
                </View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>
                    {t('booking.noPreference') || 'No Preference'}
                  </Text>
                  <Text style={styles.employeeRole}>
                    {t('booking.assignNextAvailable') || 'Assign the next available professional'}
                  </Text>
                </View>
                <View style={[styles.radio, selectedEmployee === null && styles.radioSelected]}>
                  {selectedEmployee === null && <View style={styles.radioInner} />}
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          {/* Employee Options */}
          {employees.map((employee) => {
            const isSelected = selectedEmployee === employee.id;
            const avatarUrl = (employee.photo_url || employee.avatar_url) ? getImageUrl(employee.photo_url || employee.avatar_url || '') : null;
            
            return (
              <TouchableOpacity
                key={employee.id}
                onPress={() => setSelectedEmployee(employee.id)}
                activeOpacity={0.7}
              >
                <Card style={[styles.employeeCard, isSelected && styles.employeeCardSelected]}>
                  <View style={styles.employeeContent}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.employeeAvatar} />
                    ) : (
                      <View style={styles.employeeAvatar}>
                        <Text style={styles.employeeInitials}>
                          {(employee.name || 'E')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{employee.name}</Text>
                      {employee.role && (
                        <Text style={styles.employeeRole}>{employee.role}</Text>
                      )}
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={t('common.continue') || 'Continue'}
          onPress={handleContinue}
          variant="primary"
          size="lg"
          style={styles.continueButton}
        />
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
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
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
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  employeesList: {
    flex: 1,
  },
  employeesListContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  employeeCard: {
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  employeeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  employeeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  noPreferenceAvatar: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  employeeIcon: {
    fontSize: 28,
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
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  employeeRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    padding: theme.spacing.md,
  },
  continueButton: {
    width: '100%',
  },
});

export default EmployeeSelectionScreen;

