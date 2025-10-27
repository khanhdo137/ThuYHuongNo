import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationCount } from '../context/NotificationCountContext';
import { createTestNotification } from '../services/localNotificationService';
import notificationApi, { Notification } from '../api/notificationApi';
import GradientBackground from '../components/GradientBackground';


export default function NotificationScreen() {
  const [reminders, setReminders] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const navigation = useNavigation();
  const { setCount } = useNotificationCount();


  // Load reminders, cập nhật badge count
  useEffect(() => {
    loadReminders();
  }, []);

  // Auto-refresh khi screen được focus (user quay lại từ tab khác)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 NotificationScreen focused - refreshing data');
      loadReminders();
    }, [])
  );

  // Auto-refresh định kỳ mỗi 30 giây (silent - không hiển thị loading)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh notifications (silent)');
      loadRemindersSilent();
    }, 30000); // 30 giây

    return () => clearInterval(interval);
  }, []);


  // Load reminders từ Notification table
  const loadReminders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setReminders([]);
        setCount(0);
        return;
      }

      console.log('📬 Loading reminders...');
      const response = await notificationApi.getNotifications(1, 50);
      setReminders(response.notifications || []);
      
      // Chỉ đếm unread reminders
      const unreadCount = response.notifications.filter((n: Notification) => !n.isRead).length;
      setCount(unreadCount);
      
      console.log(`📬 Found ${response.notifications.length} reminders, ${unreadCount} unread`);
      
    } catch (error: any) {
      console.error('Error loading reminders:', error);
      if (error?.response?.status !== 401) {
        setReminders([]);
        setCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load reminders silently
  const loadRemindersSilent = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await notificationApi.getNotifications(1, 50);
      
      // Only update if changed
      if (JSON.stringify(response.notifications) !== JSON.stringify(reminders)) {
        setReminders(response.notifications || []);
        
        // Chỉ đếm unread reminders
        const unreadCount = response.notifications.filter((n: Notification) => !n.isRead).length;
        setCount(unreadCount);
        
        console.log('🔄 Updated reminders silently');
      }
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.log('Silent reminder refresh failed, will retry later');
      }
    }
  };


  // Render reminder notification card
  const renderReminderCard = ({ item }: { item: Notification }) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const handleReminderPress = async (reminder: Notification) => {
      try {
        // Show detail modal
        setSelectedNotification(reminder);
        setDetailModalVisible(true);
        
        // Mark as read
        if (!reminder.isRead) {
          await notificationApi.markAsRead(reminder.notificationId);
          // Reload reminders to update UI
          await loadReminders();
        }
      } catch (error) {
        console.error('Error marking reminder as read:', error);
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.reminderCard,
          !item.isRead && styles.unreadReminderCard
        ]}
        onPress={() => handleReminderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.reminderIconContainer}>
          <Ionicons 
            name="notifications" 
            size={28} 
            color={item.isRead ? "#95A5A6" : "#E74C3C"} 
          />
        </View>
        
        <View style={styles.reminderContent}>
          <Text style={[
            styles.reminderTitle,
            !item.isRead && styles.unreadText
          ]}>
            {item.title}
          </Text>
          <Text style={styles.reminderBody} numberOfLines={4}>
            {item.body}
          </Text>
          <View style={styles.reminderFooter}>
            <Ionicons name="time-outline" size={14} color="#95A5A6" />
            <Text style={styles.reminderTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        
        {!item.isRead && (
          <View style={styles.unreadBadge} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#BDC3C7" />
      <Text style={styles.emptyTitle}>Không có thông báo</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có thông báo nào.
      </Text>
    </View>
  );

  const handleTestNotification = async () => {
    try {
      const success = await createTestNotification();
      if (success) {
        Alert.alert(
          '✅ Thành công',
          'Đã gửi test notification!\n\nMinimize app và kiểm tra status bar.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '⚠️ Thất bại',
          'Không thể tạo notification. Vui lòng kiểm tra quyền thông báo trong Settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi test notification');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#2c3e50" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Thông báo</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={handleTestNotification} style={styles.testButton}>
          <Ionicons name="flask" size={20} color="#007bff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        {renderHeader()}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Đang tải thông báo...</Text>
          </View>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(item: Notification) => item.notificationId.toString()}
            renderItem={renderReminderCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadReminders();
                  setRefreshing(false);
                }}
                colors={['#007bff']}
                tintColor="#007bff"
                title="Đang làm mới..."
                titleColor="#007bff"
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
        
        {/* Modal Chi tiết Notification */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.notificationIconLarge}>
                    <Ionicons 
                      name="notifications" 
                      size={32} 
                      color="#E74C3C" 
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setDetailModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close-circle" size={32} color="#007bff" />
                  </TouchableOpacity>
                </View>

                {selectedNotification && (
                  <View>
                    {/* Title */}
                    <Text style={styles.notificationDetailTitle}>
                      {selectedNotification.title}
                    </Text>

                    {/* Time */}
                    <View style={styles.notificationTimeRow}>
                      <Ionicons name="time-outline" size={18} color="#95A5A6" />
                      <Text style={styles.notificationDetailTime}>
                        {new Date(selectedNotification.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Body */}
                    <Text style={styles.notificationDetailBody}>
                      {selectedNotification.body}
                    </Text>

                    {/* Type Badge */}
                    {selectedNotification.type && (
                      <View style={styles.typeBadgeContainer}>
                        <View style={styles.typeBadge}>
                          <Ionicons name="pricetag" size={14} color="#3498DB" />
                          <Text style={styles.typeBadgeText}>
                            {selectedNotification.type === 'appointment_reminder' 
                              ? 'Nhắc hẹn tái khám' 
                              : selectedNotification.type}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  testButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  
  // List
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 123, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalCloseButton: {
    backgroundColor: '#007bff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Reminder Card Styles
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  unreadReminderCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#E74C3C',
    backgroundColor: '#FFFAFA',
    shadowColor: '#E74C3C',
    shadowOpacity: 0.15,
  },
  reminderIconContainer: {
    marginRight: 16,
    paddingTop: 4,
    width: 40,
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
    paddingRight: 8,
  },
  reminderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 24,
  },
  unreadText: {
    fontWeight: '700',
    color: '#E74C3C',
  },
  reminderBody: {
    fontSize: 14,
    color: '#5D6D7E',
    lineHeight: 22,
    marginBottom: 12,
  },
  reminderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  reminderTime: {
    fontSize: 12,
    color: '#95A5A6',
    marginLeft: 6,
    fontWeight: '500',
  },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E74C3C',
    marginTop: 8,
    marginLeft: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  
  // Notification Detail Modal Styles
  notificationIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationDetailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    lineHeight: 30,
  },
  notificationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationDetailTime: {
    fontSize: 14,
    color: '#95A5A6',
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 20,
  },
  notificationDetailBody: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 26,
    marginBottom: 24,
  },
  typeBadgeContainer: {
    marginBottom: 20,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 13,
    color: '#3498DB',
    marginLeft: 6,
    fontWeight: '600',
  },
  modalButtonContainer: {
    marginTop: 8,
  },
}); 