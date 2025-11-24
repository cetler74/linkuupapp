import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { navigate } from '../../navigation/navigationService';
import { useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';

const RegisterScreen = () => {
  const route = useRoute();
  const { selected_plan_code } = (route.params as any) || {};
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'customer' as 'customer' | 'business_owner',
    gdpr_data_processing_consent: false,
    gdpr_marketing_consent: false,
    selected_plan_code: selected_plan_code || undefined,
  });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();

  useEffect(() => {
    if (selected_plan_code) {
      setFormData(prev => ({ ...prev, selected_plan_code }));
    }
  }, [selected_plan_code]);

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.gdpr_data_processing_consent) {
      Alert.alert('Error', 'You must consent to data processing to continue');
      return;
    }

    setLoading(true);
    try {
      const redirectPath = await register(formData);
      // Navigation handled by AppNavigator
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={formData.first_name}
            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={formData.last_name}
            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />
        </View>

        {formData.user_type === 'business_owner' && (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.planButton}
              onPress={() => {
                navigate('PlanSelection', {
                  onPlanSelected: (planCode: string) => {
                    setFormData(prev => ({ ...prev, selected_plan_code: planCode }));
                  },
                });
              }}
            >
              <Text style={styles.planButtonText}>
                {formData.selected_plan_code
                  ? `Selected: ${formData.selected_plan_code}`
                  : 'Select Plan (Optional)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() =>
              setFormData({
                ...formData,
                gdpr_data_processing_consent: !formData.gdpr_data_processing_consent,
              })
            }
          >
            <Text>{formData.gdpr_data_processing_consent ? '✓' : ''}</Text>
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            I consent to data processing (Required)
          </Text>
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() =>
              setFormData({
                ...formData,
                gdpr_marketing_consent: !formData.gdpr_marketing_consent,
              })
            }
          >
            <Text>{formData.gdpr_marketing_consent ? '✓' : ''}</Text>
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            I consent to marketing communications (Optional)
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.registerButtonText}>Sign Up</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={[styles.socialButton, loading && styles.registerButtonDisabled]}
          onPress={async () => {
            if (loading) return;
            setLoading(true);
            try {
              await loginWithGoogle('customer', undefined, 'register');
            } catch (error: any) {
              Alert.alert(
                'Google Registration Failed',
                error.message || 'Failed to sign up with Google. Please try again.'
              );
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, loading && styles.registerButtonDisabled]}
          onPress={async () => {
            if (loading) return;
            setLoading(true);
            try {
              await loginWithFacebook('customer', undefined, 'register');
            } catch (error: any) {
              Alert.alert(
                'Facebook Registration Failed',
                error.message || 'Failed to sign up with Facebook. Please try again.'
              );
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          <Text style={styles.socialButtonText}>Continue with Facebook</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigate('Login')}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
  },
  registerButton: {
    width: '100%',
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    ...theme.shadows.md,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.placeholderLight,
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 12,
  },
  socialButtons: {
    width: '100%',
    gap: 16,
  },
  socialButton: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  socialButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  loginLink: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
  planButton: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
  },
  planButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
});

export default RegisterScreen;

