import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AddCustomerScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId } = (route.params as any) || {};
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.first_name.trim() && !formData.last_name.trim()) {
      Alert.alert(
        t('common.error') || 'Error',
        t('customers.nameRequired') || 'First name or last name is required'
      );
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert(
        t('common.error') || 'Error',
        t('customers.emailRequired') || 'Email is required'
      );
      return;
    }

    if (!validateEmail(formData.email.trim())) {
      Alert.alert(
        t('common.error') || 'Error',
        t('customers.invalidEmail') || 'Please enter a valid email address'
      );
      return;
    }

    if (!placeId) {
      Alert.alert(
        t('common.error') || 'Error',
        t('customers.placeRequired') || 'Place ID is required'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      const customerData: any = {
        email: formData.email.trim(),
      };

      if (formData.first_name.trim()) {
        customerData.first_name = formData.first_name.trim();
      }

      if (formData.last_name.trim()) {
        customerData.last_name = formData.last_name.trim();
      }

      if (formData.phone.trim()) {
        customerData.phone = formData.phone.trim();
      }

      await ownerAPI.createCustomer(placeId, customerData);
      
      Alert.alert(
        t('common.success') || 'Success',
        t('customers.customerCreated') || 'Customer created successfully',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating customer:', error);
      const errorMessage = 
        error.response?.data?.detail || 
        error.message || 
        t('customers.createError') || 
        'Failed to create customer';
      
      Alert.alert(
        t('common.error') || 'Error',
        typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('customers.addCustomer') || 'Add Customer'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {t('customers.customerInformation') || 'Customer Information'}
          </Text>

          <Input
            placeholder={t('customers.firstName') || 'First Name'}
            value={formData.first_name}
            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
            style={styles.input}
            autoCapitalize="words"
          />

          <Input
            placeholder={t('customers.lastName') || 'Last Name'}
            value={formData.last_name}
            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
            style={styles.input}
            autoCapitalize="words"
          />

          <Input
            placeholder={t('customers.email') || 'Email *'}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Input
            placeholder={t('customers.phone') || 'Phone (Optional)'}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <View style={styles.buttonContainer}>
            <Button
              title={t('customers.createCustomer') || 'Create Customer'}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              style={styles.submitButton}
            />
            {isSubmitting && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.loader}
              />
            )}
          </View>
        </Card>
      </ScrollView>
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
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  formCard: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
    position: 'relative',
  },
  submitButton: {
    width: '100%',
  },
  loader: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    marginTop: -10,
  },
});

export default AddCustomerScreen;

