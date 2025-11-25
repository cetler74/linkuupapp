import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Switch, Alert, Modal, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ownerAPI, authAPI, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '../../i18n/i18n';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

interface FeatureSettings {
  bookings_enabled: boolean;
  rewards_enabled: boolean;
  time_off_enabled: boolean;
  campaigns_enabled: boolean;
  messaging_enabled: boolean;
  notifications_enabled: boolean;
}

const OwnerSettingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [featureSettings, setFeatureSettings] = useState<FeatureSettings>({
    bookings_enabled: true,
    rewards_enabled: false,
    time_off_enabled: true,
    campaigns_enabled: true,
    messaging_enabled: true,
    notifications_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchFeatureSettings();
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    // Sync current language with i18n
    setCurrentLanguage(i18n.language || 'en');
  }, []);

  const fetchPlaces = async () => {
    try {
      setIsLoading(true);
      const response = await ownerAPI.getOwnerPlaces();
      const placesList = Array.isArray(response) ? response : [];
      setPlaces(placesList);
      if (placesList.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(placesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeatureSettings = async () => {
    if (!selectedPlaceId) return;

    try {
      const response = await ownerAPI.getPlaceFeatureSettings(selectedPlaceId);
      if (response && response.feature_settings) {
        setFeatureSettings(response.feature_settings);
      }
    } catch (error) {
      console.error('Error fetching feature settings:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlaces();
    if (selectedPlaceId) {
      fetchFeatureSettings();
    }
    setRefreshing(false);
  };

  const handleFeatureToggle = async (feature: keyof FeatureSettings) => {
    const newSettings = {
      ...featureSettings,
      [feature]: !featureSettings[feature],
    };
    setFeatureSettings(newSettings);

    if (!selectedPlaceId) return;

    try {
      setSaving(true);
      await ownerAPI.updatePlaceFeatureSettings(selectedPlaceId, newSettings);
    } catch (error) {
      console.error('Error updating feature settings:', error);
      // Revert on error
      setFeatureSettings(featureSettings);
      Alert.alert(t('common.error') || 'Error', t('settings.updateError') || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setCurrentLanguage(languageCode);
      await i18n.changeLanguage(languageCode);
      setShowLanguageModal(false);

      // Save language preference to backend
      try {
        await authAPI.updateLanguagePreference(languageCode);
      } catch (error) {
        console.error('Error saving language preference:', error);
        // Don't show error to user, language change still works locally
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error') || 'Error', t('settings.languageChangeError') || 'Failed to change language');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout') || 'Log Out',
      t('settings.confirmLogout') || 'Are you sure you want to log out?',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('settings.logout') || 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const languages = [
    { code: 'en', name: t('language.english') || 'English', nativeName: 'English' },
    { code: 'pt', name: t('language.portuguese') || 'Português', nativeName: 'Português' },
    { code: 'es', name: t('language.spanish') || 'Español', nativeName: 'Español' },
    { code: 'fr', name: t('language.french') || 'Français', nativeName: 'Français' },
    { code: 'de', name: t('language.german') || 'Deutsch', nativeName: 'Deutsch' },
    { code: 'it', name: t('language.italian') || 'Italiano', nativeName: 'Italiano' },
  ];

  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? lang.nativeName : 'English';
  };

  const selectedPlace = places.find(p => p.id === selectedPlaceId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerBranding}>
          <Logo width={32} height={32} color="#FFFFFF" animated={false} />
          <Text style={styles.headerTitle}>
            {t('settings.title') || 'Settings'}
          </Text>
        </View>
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
      >
        {/* Profile Section - Integrated into Header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || 'O')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.name || user?.email || 'Owner'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View >
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => Alert.alert('Edit Profile', 'Coming soon')}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View >

        {/* Place Selector */}
        {
          places.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('settings.selectPlace') || 'Select Place'}
              </Text>
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
            </View>
          )
        }

        {/* Feature Settings */}
        {
          selectedPlace && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('settings.featureSettings') || 'Feature Settings'}
              </Text>
              <Card style={styles.settingsCard}>
                <SettingToggle
                  icon="calendar"
                  title={t('settings.bookings') || 'Bookings'}
                  subtitle={t('settings.bookingsDesc') || 'Allow customers to book services'}
                  value={featureSettings.bookings_enabled}
                  onValueChange={() => handleFeatureToggle('bookings_enabled')}
                  disabled={saving}
                />
                <SettingToggle
                  icon="gift"
                  title={t('settings.rewards') || 'Rewards'}
                  subtitle={t('settings.rewardsDesc') || 'Enable rewards program for customers'}
                  value={featureSettings.rewards_enabled}
                  onValueChange={() => handleFeatureToggle('rewards_enabled')}
                  disabled={saving}
                />
                <SettingToggle
                  icon="calendar-clock"
                  title={t('settings.timeOff') || 'Time Off'}
                  subtitle={t('settings.timeOffDesc') || 'Allow employees to request time off'}
                  value={featureSettings.time_off_enabled}
                  onValueChange={() => handleFeatureToggle('time_off_enabled')}
                  disabled={saving}
                />
                <SettingToggle
                  icon="bullhorn"
                  title={t('settings.campaigns') || 'Campaigns'}
                  subtitle={t('settings.campaignsDesc') || 'Create and manage marketing campaigns'}
                  value={featureSettings.campaigns_enabled}
                  onValueChange={() => handleFeatureToggle('campaigns_enabled')}
                  disabled={saving}
                />
                <SettingToggle
                  icon="message-text"
                  title={t('settings.messaging') || 'Messaging'}
                  subtitle={t('settings.messagingDesc') || 'Enable customer messaging'}
                  value={featureSettings.messaging_enabled}
                  onValueChange={() => handleFeatureToggle('messaging_enabled')}
                  disabled={saving}
                />
                <SettingToggle
                  icon="bell"
                  title={t('settings.notifications') || 'Notifications'}
                  subtitle={t('settings.notificationsDesc') || 'Receive push and email notifications'}
                  value={featureSettings.notifications_enabled}
                  onValueChange={() => handleFeatureToggle('notifications_enabled')}
                  disabled={saving}
                  isLast
                />
              </Card>
            </View>
          )
        }

        {/* Management */}
        {
          selectedPlace && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('settings.management') || 'Management'}
              </Text>
              <Card style={styles.settingsCard}>
                <SettingItem
                  icon="office-building-outline"
                  title={t('settings.managePlaces') || 'Manage Places'}
                  subtitle={t('settings.managePlacesDesc') || 'View and manage your business places'}
                  onPress={() => {
                    navigation.navigate('Places' as never);
                  }}
                />
                <SettingItem
                  icon="content-cut"
                  title={t('settings.manageServices') || 'Manage Services'}
                  subtitle={t('settings.manageServicesDesc') || 'Add, edit, or remove services'}
                  onPress={() => {
                    if (selectedPlaceId) {
                      navigation.navigate('ServicesManagement' as never, { placeId: selectedPlaceId } as never);
                    } else {
                      Alert.alert(t('common.error') || 'Error', t('settings.selectPlaceFirst') || 'Please select a place first');
                    }
                  }}
                  isLast
                />
              </Card>
            </View>
          )
        }

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.accountSettings') || 'Account Settings'}
          </Text>
          <Card style={styles.settingsCard}>
            <SettingItem
              icon="credit-card-outline"
              title={t('billing.title') || 'Billing & Subscription'}
              subtitle={t('billing.manageSubscription') || 'Manage your subscription and billing'}
              onPress={() => {
                navigation.navigate('Billing' as never);
              }}
            />
            <SettingItem
              icon="lock-outline"
              title={t('settings.changePassword') || 'Change Password'}
              onPress={() => {
                Alert.alert(t('settings.changePassword') || 'Change Password', 'Coming soon');
              }}
            />
            <SettingItem
              icon="translate"
              title={t('settings.language') || 'Language'}
              subtitle={getCurrentLanguageName()}
              onPress={() => setShowLanguageModal(true)}
            />
            <SettingItem
              icon="bell-outline"
              title={t('settings.notificationPreferences') || 'Notification Preferences'}
              subtitle={t('settings.notificationPreferencesDesc') || 'Manage notification settings'}
              onPress={() => {
                Alert.alert(t('settings.notificationPreferences') || 'Notification Preferences', 'Coming soon');
              }}
            />
            <SettingItem
              icon="help-circle-outline"
              title={t('settings.help') || 'Help & Support'}
              onPress={() => {
                Alert.alert(t('settings.help') || 'Help & Support', 'Coming soon');
              }}
              isLast
            />
          </Card>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>
            {t('settings.logout') || 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView >

      {/* Language Selection Modal */}
      < Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('settings.selectLanguage') || 'Select Language'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  currentLanguage === language.code && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange(language.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={[
                    styles.languageName,
                    currentLanguage === language.code && styles.languageNameActive,
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={styles.languageCode}>
                    {language.name}
                  </Text>
                </View>
                {currentLanguage === language.code && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal >
    </View >
  );
};

interface SettingToggleProps {
  icon: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
  isLast?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  isLast = false,
}) => {
  return (
    <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
      <View style={styles.settingRowLeft}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={icon as any} size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.settingRowText}>
          <Text style={styles.settingRowTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingRowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.colors.borderLight, true: theme.colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  isLast = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.settingRow, isLast && styles.settingRowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingRowLeft}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={icon as any} size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.settingRowText}>
          <Text style={styles.settingRowTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingRowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.placeholderLight} />
    </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  userName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginRight: theme.spacing.sm,
    ...theme.shadows.sm,
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
    fontWeight: theme.typography.fontWeight.bold,
  },
  settingsCard: {
    padding: 0,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRowText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingRowTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  settingRowSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#ef4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalContent: {
    flex: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  languageOptionActive: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  languageOptionContent: {
    flex: 1,
  },
  languageName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  languageNameActive: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  languageCode: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
  },
});

export default OwnerSettingsScreen;
