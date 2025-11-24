import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Switch, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ownerAPI, authAPI, type Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '../../i18n/i18n';

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
      // TODO: Implement API call to fetch feature settings
      // const response = await ownerAPI.getPlaceFeatureSettings(selectedPlaceId);
      // setFeatureSettings(response.feature_settings);
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
      // TODO: Implement API call to update feature settings
      // await ownerAPI.updatePlaceFeatureSettings(selectedPlaceId, newSettings);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('settings.title') || 'Settings'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {(user?.first_name || user?.email || 'O')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>
              {user?.first_name || user?.email || 'Owner'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        {/* Place Selector */}
        {places.length > 1 && (
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
        )}

        {/* Feature Settings */}
        {selectedPlace && (
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
        )}

        {/* Management */}
        {selectedPlace && (
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
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.accountSettings') || 'Account Settings'}
          </Text>
          <Card style={styles.settingsCard}>
            <SettingItem
              icon="lock-outline"
              title={t('settings.changePassword') || 'Change Password'}
              onPress={() => {
                // TODO: Navigate to change password screen
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
                // TODO: Navigate to notification preferences screen
                Alert.alert(t('settings.notificationPreferences') || 'Notification Preferences', 'Coming soon');
              }}
            />
            <SettingItem
              icon="help-circle-outline"
              title={t('settings.help') || 'Help & Support'}
              onPress={() => {
                // TODO: Navigate to help screen
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
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
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
      </Modal>
    </View>
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
        <MaterialCommunityIcons name={icon as any} size={24} color={theme.colors.textLight} />
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
        <MaterialCommunityIcons name={icon as any} size={24} color={theme.colors.textLight} />
        <View style={styles.settingRowText}>
          <Text style={styles.settingRowTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingRowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.placeholderLight} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
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
  settingsCard: {
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
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
    paddingHorizontal: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  languageOptionActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  languageOptionContent: {
    flex: 1,
  },
  languageName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs / 2,
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
