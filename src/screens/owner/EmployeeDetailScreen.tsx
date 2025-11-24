import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, type PlaceEmployee, type PlaceService } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getImageUrl } from '../../api/api';

const EmployeeDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { employeeId, placeId } = (route.params as any) || {};
  
  const [employee, setEmployee] = useState<PlaceEmployee | null>(null);
  const [services, setServices] = useState<PlaceService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    if (!employeeId) return;
    try {
      setIsLoading(true);
      const employeeData = await ownerAPI.getEmployee(employeeId);
      setEmployee(employeeData);
      
      // Fetch assigned services
      try {
        const employeeServices = await ownerAPI.getEmployeeServices(employeeId);
        setServices(Array.isArray(employeeServices) ? employeeServices : []);
      } catch (error) {
        console.error('Error fetching employee services:', error);
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      Alert.alert(t('common.error') || 'Error', t('employees.loadError') || 'Failed to load employee');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EmployeeForm' as never, {
      placeId,
      employeeId: employee?.id,
    } as never);
  };

  const handleDelete = () => {
    if (!employee) return;
    Alert.alert(
      t('common.confirmDelete') || 'Confirm Delete',
      t('employees.deleteEmployeeConfirm') || 'Are you sure you want to delete this employee?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerAPI.deleteEmployee(employee.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting employee:', error);
              Alert.alert(t('common.error') || 'Error', t('employees.deleteError') || 'Failed to delete employee');
            }
          },
        },
      ]
    );
  };

  const handleDeletePhoto = () => {
    if (!employee) return;
    Alert.alert(
      t('common.confirmDelete') || 'Confirm Delete',
      t('employees.deletePhotoConfirm') || 'Are you sure you want to delete this photo?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerAPI.deleteEmployeePhoto(employee.id);
              fetchEmployeeDetails(); // Refresh to update photo
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert(t('common.error') || 'Error', t('employees.deletePhotoError') || 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (employee?.phone) {
      Linking.openURL(`tel:${employee.phone}`);
    }
  };

  const handleEmail = () => {
    if (employee?.email) {
      Linking.openURL(`mailto:${employee.email}`);
    }
  };

  const formatWorkingHours = (hours: { [key: string]: any } | undefined) => {
    if (!hours || Object.keys(hours).length === 0) {
      return t('employees.noWorkingHours') || 'No working hours set';
    }
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames: { [key: string]: string } = {
      monday: t('common.monday') || 'Monday',
      tuesday: t('common.tuesday') || 'Tuesday',
      wednesday: t('common.wednesday') || 'Wednesday',
      thursday: t('common.thursday') || 'Thursday',
      friday: t('common.friday') || 'Friday',
      saturday: t('common.saturday') || 'Saturday',
      sunday: t('common.sunday') || 'Sunday',
    };
    
    return days.map(day => {
      const dayHours = hours[day];
      if (!dayHours || !dayHours.is_open) {
        return `${dayNames[day]}: ${t('common.closed') || 'Closed'}`;
      }
      return `${dayNames[day]}: ${dayHours.start_time || 'N/A'} - ${dayHours.end_time || 'N/A'}`;
    }).join('\n');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('employees.employeeDetails') || 'Employee Details'}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('employees.employeeDetails') || 'Employee Details'}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t('employees.employeeNotFound') || 'Employee not found'}
          </Text>
        </View>
      </View>
    );
  }

  const avatarUrl = employee.photo_url ? getImageUrl(employee.photo_url) : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('employees.employeeDetails') || 'Employee Details'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <>
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={handleDeletePhoto}
                  >
                    <MaterialCommunityIcons name="delete" size={18} color={theme.colors.secondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>
                    {employee.name[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.employeeName}>{employee.name}</Text>
              {employee.role && (
                <Text style={styles.employeeRole}>{employee.role}</Text>
              )}
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, employee.is_active ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>
                    {employee.is_active ? t('employees.active') || 'Active' : t('employees.inactive') || 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('employees.contactInformation') || 'Contact Information'}
          </Text>
          {employee.email && (
            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{employee.email}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.placeholderLight} />
            </TouchableOpacity>
          )}
          {employee.phone && (
            <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{employee.phone}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.placeholderLight} />
            </TouchableOpacity>
          )}
          {!employee.email && !employee.phone && (
            <Text style={styles.noDataText}>
              {t('employees.noContactInfo') || 'No contact information available'}
            </Text>
          )}
        </Card>

        {/* Professional Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('employees.professionalInformation') || 'Professional Information'}
          </Text>
          {employee.specialty && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('employees.specialty') || 'Specialty'}:
              </Text>
              <Text style={styles.infoValue}>{employee.specialty}</Text>
            </View>
          )}
          {employee.color_code && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('employees.colorCode') || 'Color Code'}:
              </Text>
              <View style={[styles.colorCodeBox, { backgroundColor: employee.color_code }]} />
              <Text style={styles.infoValue}>{employee.color_code}</Text>
            </View>
          )}
        </Card>

        {/* Assigned Services */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('employees.assignedServices') || 'Assigned Services'}
            </Text>
            <Text style={styles.serviceCount}>
              {services.length} {services.length === 1 ? t('employees.service') || 'service' : t('employees.services') || 'services'}
            </Text>
          </View>
          {services.length > 0 ? (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <View key={service.id} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.description && (
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceDetail}>
                        {service.duration} {t('booking.min') || 'min'}
                      </Text>
                      <Text style={styles.serviceDetail}>
                        €{service.price?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>
              {t('employees.noServices') || 'No services assigned'}
            </Text>
          )}
        </Card>

        {/* Working Hours */}
        {employee.working_hours && Object.keys(employee.working_hours).length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {t('employees.workingHours') || 'Working Hours'}
            </Text>
            <Text style={styles.workingHoursText}>
              {formatWorkingHours(employee.working_hours)}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          title={t('common.edit') || 'Edit'}
          onPress={handleEdit}
          variant="primary"
          size="lg"
          style={styles.footerButton}
        />
        <Button
          title={t('common.delete') || 'Delete'}
          onPress={handleDelete}
          variant="outline"
          size="lg"
          style={styles.footerButton}
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
    padding: theme.spacing.xs,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
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
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
  },
  profileCard: {
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  avatarInitials: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  employeeRole: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: theme.colors.placeholderLight,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#FFFFFF',
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  contactText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    minWidth: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
  },
  colorCodeBox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  serviceCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  servicesList: {
    gap: theme.spacing.sm,
  },
  serviceItem: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  serviceInfo: {
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
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  serviceDetail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
  workingHoursText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    lineHeight: 24,
  },
  noDataText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.backgroundLight,
  },
  footerButton: {
    flex: 1,
  },
});

export default EmployeeDetailScreen;

