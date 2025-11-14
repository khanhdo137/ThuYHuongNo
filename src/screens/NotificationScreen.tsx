import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationCount } from '../context/NotificationCountContext';
import { createTestNotification } from '../services/localNotificationService';
import notificationApi, { Notification } from '../api/notificationApi';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';


export default function NotificationScreen() {
  const [reminders, setReminders] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [petDetails, setPetDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const navigation = useNavigation();
  const { setCount } = useNotificationCount();


  // Check authentication on mount and load reminders only if authenticated
  useEffect(() => {
    let mounted = true;
    const checkAuthAndLoad = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!mounted) return;
        const auth = !!token;
        setIsAuthenticated(auth);
        if (auth) {
          await loadReminders();
        } else {
          // not authenticated: don't attempt to fetch, show prompt
          setReminders([]);
          setCount(0);
          setLoading(false);
        }
      } catch (err) {
        console.log('Error checking auth for notifications:', err);
        setIsAuthenticated(false);
        setReminders([]);
        setCount(0);
        setLoading(false);
      }
    };

    checkAuthAndLoad();
    return () => { mounted = false; };
  }, []);

  // Auto-refresh khi screen được focus (user quay lại từ tab khác)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 NotificationScreen focused - refreshing data');
      if (isAuthenticated) {
        loadReminders();
      }
    }, [isAuthenticated])
  );

  // Auto-refresh định kỳ mỗi 30 giây (silent - không hiển thị loading)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh notifications (silent)');
      loadRemindersSilent();
    }, 30000); // 30 giây

    return () => clearInterval(interval);
  }, [isAuthenticated]);


  // Load reminders từ Notification table
  const loadReminders = async () => {
    try {
      if (isAuthenticated === false) {
        // not authenticated: skip fetching
        setReminders([]);
        setCount(0);
        setLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setReminders([]);
        setCount(0);
        setLoading(false);
        setIsAuthenticated(false);
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
      if (isAuthenticated === false) return;
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
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

  // Load appointment and pet details
  const loadAppointmentDetails = async (notification: Notification) => {
    setLoadingDetails(true);
    try {
      // Extract appointment ID from notification data
      const data = notification.data ? JSON.parse(notification.data) : {};
      const appointmentId = data.appointmentId || data.medicalHistoryId;
      
      if (appointmentId) {
        // Load appointment details
        const appointmentResponse = await apiClient.get(`/Appointment/${appointmentId}`);
        setAppointmentDetails(appointmentResponse.data);
        
        // Load pet details if available
        if (appointmentResponse.data.petId) {
          const petResponse = await apiClient.get(`/Pet/${appointmentResponse.data.petId}`);
          setPetDetails(petResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading appointment details:', error);
    } finally {
      setLoadingDetails(false);
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
        
        // Load appointment and pet details
        await loadAppointmentDetails(reminder);
        
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

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'appointment_reminder':
          return 'calendar';
        case 'appointment_confirmed':
          return 'checkmark-circle';
        case 'appointment_cancelled':
          return 'close-circle';
        default:
          return 'notifications';
      }
    };

    const getNotificationColor = (type: string, isRead: boolean) => {
      if (isRead) return "#95A5A6";
      
      switch (type) {
        case 'appointment_reminder':
          return "#FF6B35";
        case 'appointment_confirmed':
          return "#27AE60";
        case 'appointment_cancelled':
          return "#E74C3C";
        default:
          return "#3498DB";
      }
    };

    // Enhanced: detect appointment status change in notification.data and adjust display
    let displayTitle = item.title;
    let displayBody = item.body;
    let displayType = item.type;
    try {
      if (item.data) {
        const parsed = JSON.parse(item.data);
        // Support payloads with { oldStatus, newStatus } or { status }
        const oldStatus = parsed.oldStatus ?? parsed.previousStatus ?? parsed.prevStatus;
        const newStatus = parsed.newStatus ?? parsed.status ?? parsed.currentStatus;
        // Map numeric statuses to labels used in app
        const statusLabel = (s: any) => {
          if (s === 0) return 'Chờ xác nhận';
          if (s === 1) return 'Đã xác nhận';
          if (s === 2) return 'Hoàn thành';
          if (s === 3) return 'Đã hủy';
          return null;
        };

        if (newStatus !== undefined) {
          // If notification reports a status update, show a clearer message
          if (Number(newStatus) === 1) {
            displayTitle = 'Lịch hẹn đã được xác nhận';
            displayBody = parsed.message || `Lịch hẹn của bạn đã được thay đổi trạng thái: ${statusLabel(newStatus)}`;
            displayType = 'appointment_confirmed';
          } else if (Number(newStatus) === 3) {
            displayTitle = 'Lịch hẹn đã bị hủy';
            displayBody = parsed.message || `Lịch hẹn của bạn đã bị hủy`;
            displayType = 'appointment_cancelled';
          } else if (oldStatus !== undefined && Number(oldStatus) !== Number(newStatus)) {
            // other status transitions (e.g., to completed)
            const lbl = statusLabel(newStatus) || 'đã thay đổi';
            displayTitle = `Lịch hẹn đã được cập nhật: ${lbl}`;
            displayBody = parsed.message || `Lịch hẹn của bạn đã được cập nhật: ${lbl}`;
            displayType = 'appointment_status_changed';
          }
        }
      }
    } catch (e) {
      // ignore parse errors and keep server title/body
    }

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
          <View style={[
            styles.reminderIconBackground,
            { backgroundColor: getNotificationColor(displayType || '', item.isRead) + '20' }
          ]}>
            <Ionicons 
              name={getNotificationIcon(displayType || '')} 
              size={24} 
              color={getNotificationColor(displayType || '', item.isRead)} 
            />
          </View>
        </View>
        
        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text style={[
              styles.reminderTitle,
              !item.isRead && styles.unreadText
            ]}>
              {displayTitle}
            </Text>
            {!item.isRead && (
              <View style={styles.unreadBadge} />
            )}
          </View>
          
          <Text style={styles.reminderBody} numberOfLines={3}>
            {displayBody}
          </Text>
          
          <View style={styles.reminderFooter}>
            <View style={styles.reminderTimeContainer}>
              <Ionicons name="time-outline" size={14} color="#95A5A6" />
              <Text style={styles.reminderTime}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
            
            {displayType && (
              <View style={[
                styles.typeChip,
                { backgroundColor: getNotificationColor(displayType, item.isRead) + '20' }
              ]}>
                <Text style={[
                  styles.typeChipText,
                  { color: getNotificationColor(displayType, item.isRead) }
                ]}>
                  {displayType === 'appointment_reminder' ? 'Nhắc hẹn' : 
                   displayType === 'appointment_confirmed' ? 'Xác nhận' :
                   displayType === 'appointment_cancelled' ? 'Hủy' :
                   displayType === 'appointment_status_changed' ? 'Cập nhật' : displayType}
                </Text>
              </View>
            )}
          </View>
        </View>
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
        
        {isAuthenticated === false ? (
          // Show prompt to login instead of attempting to fetch notifications
          <View style={styles.unauthContainer}>
            <Ionicons name="log-in" size={64} color="#BDC3C7" />
            <Text style={styles.unauthTitle}>Bạn chưa đăng nhập</Text>
            <Text style={styles.unauthSubtitle}>Đăng nhập để nhận thông báo và nhắc nhở từ phòng khám.</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => (navigation as any).navigate('Login')}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
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

                    {/* Appointment Details */}
                    {loadingDetails ? (
                      <View style={styles.loadingDetailsContainer}>
                        <ActivityIndicator size="small" color="#007bff" />
                        <Text style={styles.loadingDetailsText}>Đang tải chi tiết...</Text>
                      </View>
                    ) : appointmentDetails && (
                      <View style={styles.appointmentDetailsContainer}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="calendar" size={20} color="#007bff" />
                          <Text style={styles.sectionTitle}>Thông tin lịch hẹn</Text>
                        </View>
                        
                        <View style={styles.detailCard}>
                          <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Ngày hẹn:</Text>
                            <Text style={styles.detailValue}>
                              {new Date(appointmentDetails.appointmentDate).toLocaleDateString('vi-VN')}
                            </Text>
                          </View>
                          
                          <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={16} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Giờ hẹn:</Text>
                            <Text style={styles.detailValue}>{appointmentDetails.appointmentTime}</Text>
                          </View>
                          
                          <View style={styles.detailRow}>
                            <Ionicons name="medical-outline" size={16} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Dịch vụ:</Text>
                            <Text style={styles.detailValue}>{appointmentDetails.service?.name || 'N/A'}</Text>
                          </View>
                          
                          <View style={styles.detailRow}>
                            <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Trạng thái:</Text>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: appointmentDetails.status === 1 ? '#27AE60' : 
                                               appointmentDetails.status === 2 ? '#3498DB' :
                                               appointmentDetails.status === 3 ? '#E74C3C' : '#95A5A6' }
                            ]}>
                              <Text style={styles.statusText}>
                                {appointmentDetails.status === 0 ? 'Chờ xác nhận' :
                                 appointmentDetails.status === 1 ? 'Đã xác nhận' :
                                 appointmentDetails.status === 2 ? 'Hoàn thành' :
                                 appointmentDetails.status === 3 ? 'Đã hủy' : 'Không xác định'}
                              </Text>
                            </View>
                          </View>
                          
                          {appointmentDetails.notes && (
                            <View style={styles.detailRow}>
                              <Ionicons name="document-text-outline" size={16} color="#7f8c8d" />
                              <Text style={styles.detailLabel}>Ghi chú:</Text>
                              <Text style={styles.detailValue}>{appointmentDetails.notes}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Pet Details */}
                    {petDetails && (
                      <View style={styles.petDetailsContainer}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="paw" size={20} color="#FF6B35" />
                          <Text style={styles.sectionTitle}>Thông tin thú cưng</Text>
                        </View>
                        
                        <View style={styles.detailCard}>
                          <View style={styles.petInfoRow}>
                            {petDetails.imageUrl ? (
                              <Image 
                                source={{ uri: petDetails.imageUrl }} 
                                style={styles.petImage}
                              />
                            ) : (
                              <View style={[styles.petImage, { backgroundColor: '#E9ECEF', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="paw" size={24} color="#6C757D" />
                              </View>
                            )}
                            <View style={styles.petInfo}>
                              <Text style={styles.petName}>{petDetails.name}</Text>
                              <Text style={styles.petSpecies}>{petDetails.species}</Text>
                              <Text style={styles.petBreed}>{petDetails.breed}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Tuổi:</Text>
                            <Text style={styles.detailValue}>{petDetails.age || 'N/A'}</Text>
                          </View>
                          
                          <View style={styles.detailRow}>
                            <Ionicons name="male-female-outline" size={16} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Giới tính:</Text>
                            <Text style={styles.detailValue}>{petDetails.gender || 'N/A'}</Text>
                          </View>
                          
                          {petDetails.weight && (
                            <View style={styles.detailRow}>
                              <Ionicons name="scale-outline" size={16} color="#7f8c8d" />
                              <Text style={styles.detailLabel}>Cân nặng:</Text>
                              <Text style={styles.detailValue}>{petDetails.weight} kg</Text>
                            </View>
                          )}
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  unreadReminderCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
    shadowColor: '#FF6B35',
    shadowOpacity: 0.15,
    borderColor: '#FF6B35',
  },
  reminderIconContainer: {
    marginRight: 16,
    paddingTop: 2,
    width: 50,
    alignItems: 'center',
  },
  reminderIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
    paddingRight: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    lineHeight: 24,
  },
  unreadText: {
    fontWeight: '700',
    color: '#FF6B35',
  },
  reminderBody: {
    fontSize: 15,
    color: '#5D6D7E',
    lineHeight: 22,
    marginBottom: 16,
  },
  reminderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTime: {
    fontSize: 13,
    color: '#95A5A6',
    marginLeft: 6,
    fontWeight: '500',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
    marginLeft: 8,
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

  // New styles for appointment and pet details
  loadingDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingDetailsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  appointmentDetailsContainer: {
    marginTop: 24,
  },
  petDetailsContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginLeft: 8,
  },
  detailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  petInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  // Unauthenticated prompt styles
  unauthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 12,
  },
  unauthSubtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  loginButton: {
    marginTop: 18,
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
}); 