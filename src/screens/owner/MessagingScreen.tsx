import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, Dimensions, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ownerAPI, Place } from '../../api/api';
import { theme } from '../../theme/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

interface Message {
  id: number;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  sender_type: 'customer' | 'business' | 'system';
  message_type: 'inquiry' | 'booking' | 'complaint' | 'system' | 'reply';
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  parent_message_id?: number;
}

const MessagingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId: routePlaceId } = (route.params as any) || {};

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(routePlaceId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'inquiry' | 'booking' | 'complaint'>('all');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchMessages();
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    filterMessages();
  }, [filter, messages]);

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

  const fetchMessages = async () => {
    if (!selectedPlaceId) return;
    try {
      setIsLoading(true);
      const response = await ownerAPI.getPlaceMessages(selectedPlaceId);
      setMessages(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];
    if (filter === 'unread') {
      filtered = filtered.filter((m) => !m.is_read);
    } else if (filter !== 'all') {
      filtered = filtered.filter((m) => m.message_type === filter);
    }
    setFilteredMessages(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleMessageSelect = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      try {
        await ownerAPI.markMessageRead(message.id);
        fetchMessages();
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim() || !selectedPlaceId) {
      Alert.alert(t('common.error') || 'Error', t('messages.fillMessage') || 'Please enter a message.');
      return;
    }
    setReplying(true);
    try {
      await ownerAPI.replyToMessage(selectedMessage.id, replyText);
      Alert.alert(t('common.success') || 'Success', t('messages.replySent') || 'Reply sent successfully!');
      setShowReplyModal(false);
      setReplyText('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      Alert.alert(t('common.error') || 'Error', error.message || (t('messages.replyError') || 'Failed to send reply.'));
    } finally {
      setReplying(false);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'message-question';
      case 'booking':
        return 'calendar';
      case 'complaint':
        return 'alert-circle';
      case 'system':
        return 'information';
      default:
        return 'message-text';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'inquiry':
        return theme.colors.primary;
      case 'booking':
        return '#10b981';
      case 'complaint':
        return theme.colors.secondary;
      case 'system':
        return '#f59e0b';
      default:
        return theme.colors.placeholderLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('messages.justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('messages.minutesAgo') || 'minutes ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('messages.hoursAgo') || 'hours ago'}`;
    if (diffDays < 7) return `${diffDays} ${t('messages.daysAgo') || 'days ago'}`;
    return date.toLocaleDateString();
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

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
            {t('messages.title') || 'Messaging'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Place Selector */}
      {places.length > 1 && (
        <View style={styles.placeSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
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

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {(['all', 'unread', 'inquiry', 'booking', 'complaint'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[styles.filterChip, filter === filterType && styles.filterChipActive]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === filterType && styles.filterTextActive,
                ]}
              >
                {t(`messages.${filterType}`) || filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredMessages.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <MaterialCommunityIcons
            name="message-text-outline"
            size={64}
            color={theme.colors.placeholderLight}
          />
          <Text style={styles.emptyText}>
            {t('messages.noMessages') || 'No messages found.'}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredMessages.map((message) => {
            const iconColor = getMessageTypeColor(message.message_type);
            return (
              <TouchableOpacity
                key={message.id}
                onPress={() => handleMessageSelect(message)}
                activeOpacity={0.7}
              >
                <Card style={[styles.messageCard, !message.is_read && styles.unreadCard]}>
                  <View style={styles.messageHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                      <MaterialCommunityIcons
                        name={getMessageIcon(message.message_type) as any}
                        size={24}
                        color={iconColor}
                      />
                    </View>
                    <View style={styles.messageInfo}>
                      <View style={styles.messageTitleRow}>
                        <Text style={styles.messageTitle} numberOfLines={1}>
                          {message.subject || message.customer_name || t('messages.noSubject') || 'No Subject'}
                        </Text>
                        {!message.is_read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.messageCustomer} numberOfLines={1}>
                        {message.customer_name || message.customer_email || t('messages.unknownCustomer') || 'Unknown Customer'}
                      </Text>
                      <Text style={styles.messagePreview} numberOfLines={2}>
                        {message.content}
                      </Text>
                      <Text style={styles.messageTime}>
                        {formatDate(message.created_at)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedMessage !== null}
          onRequestClose={() => setSelectedMessage(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedMessage.subject || t('messages.messageDetails') || 'Message Details'}
                </Text>
                <TouchableOpacity onPress={() => setSelectedMessage(null)}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <View style={styles.messageDetailSection}>
                  <Text style={styles.detailLabel}>
                    {t('messages.from') || 'From'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedMessage.customer_name || selectedMessage.customer_email || t('messages.unknownCustomer') || 'Unknown Customer'}
                  </Text>
                </View>

                <View style={styles.messageDetailSection}>
                  <Text style={styles.detailLabel}>
                    {t('messages.type') || 'Type'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedMessage.message_type.charAt(0).toUpperCase() + selectedMessage.message_type.slice(1)}
                  </Text>
                </View>

                <View style={styles.messageDetailSection}>
                  <Text style={styles.detailLabel}>
                    {t('messages.date') || 'Date'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.messageDetailSection}>
                  <Text style={styles.detailLabel}>
                    {t('messages.message') || 'Message'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedMessage.content}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title={t('messages.reply') || 'Reply'}
                  onPress={() => {
                    setShowReplyModal(true);
                  }}
                  variant="primary"
                  style={styles.modalButton}
                />
                <Button
                  title={t('common.close') || 'Close'}
                  onPress={() => setSelectedMessage(null)}
                  variant="secondary"
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Reply Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReplyModal}
        onRequestClose={() => setShowReplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('messages.reply') || 'Reply'}
              </Text>
              <TouchableOpacity onPress={() => setShowReplyModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.replyContainer}>
              <Text style={styles.replyLabel}>
                {t('messages.yourReply') || 'Your Reply'}
              </Text>
              <TextInput
                style={styles.replyInput}
                placeholder={t('messages.replyPlaceholder') || 'Type your reply...'}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel') || 'Cancel'}
                onPress={() => {
                  setShowReplyModal(false);
                  setReplyText('');
                }}
                variant="secondary"
                style={styles.modalButton}
                disabled={replying}
              />
              <Button
                title={replying ? (t('messages.sending') || 'Sending...') : (t('messages.send') || 'Send')}
                onPress={handleReply}
                variant="primary"
                style={styles.modalButton}
                disabled={replying || !replyText.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  badge: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  placeSelectorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  placeSelectorContent: {
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
  filtersContainer: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  messageCard: {
    marginBottom: theme.spacing.md,
  },
  unreadCard: {
    backgroundColor: `${theme.colors.primary}05`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInfo: {
    flex: 1,
  },
  messageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  messageTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  messageCustomer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  messagePreview: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  messageTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.placeholderLight,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  modalScrollView: {
    maxHeight: 400,
    padding: theme.spacing.md,
  },
  messageDetailSection: {
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.placeholderLight,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  replyContainer: {
    padding: theme.spacing.md,
  },
  replyLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    minHeight: 120,
    backgroundColor: theme.colors.backgroundLight,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});

export default MessagingScreen;
