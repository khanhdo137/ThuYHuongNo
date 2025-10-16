import apiClient from '@/api/client';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationCount } from '../context/NotificationCountContext';
import { markNotificationAsViewed } from '../services/localNotificationService';
import GradientBackground from '../components/GradientBackground';

interface Appointment {
  appointmentId: number;
  serviceName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: number;
  statusText?: string;
  doctorName?: string;
  notes?: string;
  petSpecies?: string;
  petAge?: number;
  servicePrice?: number;
}

const VIEWED_NOTIFICATIONS_KEY = '@viewed_notifications';

export default function NotificationScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<Set<number>>(new Set());
  const navigation = useNavigation();
  const { setCount } = useNotificationCount();

  // Load danh sách thông báo đã xem từ AsyncStorage
  useEffect(() => {
    loadViewedNotifications();
  }, []);

  // Load appointments và cập nhật badge count
  useEffect(() => {
    loadAppointments();
  }, [viewedNotifications]);

  // Auto-refresh khi screen được focus (user quay lại từ tab khác)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 NotificationScreen focused - refreshing data');
      loadAppointments();
    }, [viewedNotifications])
  );

  // Auto-refresh định kỳ mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh notifications');
      loadAppointments();
    }, 30000); // 30 giây

    return () => clearInterval(interval);
  }, [viewedNotifications]);

  const loadViewedNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
      if (stored) {
        const viewedIds = JSON.parse(stored);
        setViewedNotifications(new Set(viewedIds));
      }
    } catch (error) {
      console.error('Error loading viewed notifications:', error);
    }
  };

  const loadAppointments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Kiểm tra token trước khi gọi API
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setAppointments([]);
        return;
      }

      console.log('📡 Loading appointments...');
      const res = await apiClient.get('/Appointment', { params: { limit: 50, page: 1 } });
      const all: Appointment[] = res.data.appointments || res.data || [];
      
      // Tính ngày 10 ngày trước
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      // Lọc lịch đã duyệt (status 1) và đã hủy (status 3) trong 10 ngày gần đây
      const filtered = all.filter((item: Appointment) => {
        // Check status
        if (item.status !== 1 && item.status !== 3) return false;
        
        // Check date - chỉ lấy trong 10 ngày gần đây
        const appointmentDate = new Date(`${item.appointmentDate} ${item.appointmentTime}`);
        return appointmentDate >= tenDaysAgo;
      });
      
      // Sắp xếp theo thời gian gần nhất lên trên
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      setAppointments(sorted);
      
      // Cập nhật badge count - chỉ đếm những thông báo chưa xem
      const unviewedCount = sorted.filter(
        (item) => !viewedNotifications.has(item.appointmentId)
      ).length;
      
      console.log(`🔔 Found ${sorted.length} appointments (last 10 days), ${unviewedCount} unviewed`);
      setCount(unviewedCount);
    } catch (error: any) {
      // Im lặng lỗi 401
      if (error?.response?.status !== 401) {
        console.error('Error loading appointments:', error);
      }
      setAppointments([]);
      setCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Đánh dấu thông báo đã xem
  const markAsViewed = async (appointmentId: number) => {
    try {
      // Sử dụng Local Notification Service
      await markNotificationAsViewed(appointmentId);
      
      const newViewedSet = new Set(viewedNotifications);
      newViewedSet.add(appointmentId);
      setViewedNotifications(newViewedSet);
      
      // Cập nhật badge count
      const unviewedCount = appointments.filter(
        (item) => !newViewedSet.has(item.appointmentId)
      ).length;
      setCount(unviewedCount);
      
      console.log(`✅ Marked appointment ${appointmentId} as viewed`);
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
    }
  };

  // Xử lý khi nhấn vào một lịch hẹn
  const handleAppointmentPress = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
    
    // Đánh dấu đã xem
    await markAsViewed(appointment.appointmentId);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#F39C12'; // Chờ xác nhận
      case 1: return '#27AE60'; // Đã duyệt
      case 2: return '#3498DB'; // Đã hoàn thành
      case 3: return '#E74C3C'; // Đã hủy
      default: return '#95A5A6';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0: return 'time-outline';
      case 1: return 'checkmark-circle-outline';
      case 2: return 'ribbon-outline';
      case 3: return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Chờ xác nhận';
      case 1: return 'Đã duyệt';
      case 2: return 'Đã hoàn thành';
      case 3: return 'Đã hủy';
      default: return '';
    }
  };

  const renderNotificationCard = ({ item }: { item: Appointment }) => {
    const isViewed = viewedNotifications.has(item.appointmentId);
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleAppointmentPress(item)}
        style={styles.notificationCardContainer}
      >
        <View style={[styles.notificationCard, !isViewed && styles.unviewedCard]}>
          {!isViewed && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>MỚI</Text>
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons name={getStatusIcon(item.status)} size={14} color="white" />
            <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
          </View>

          {/* Main Content */}
          <View style={styles.cardContent}>
            {/* Service & Pet Info */}
            <View style={styles.mainInfo}>
              <View style={styles.serviceInfo}>
                <Ionicons name="medical" size={20} color="#007bff" />
                <Text style={styles.serviceName}>{item.serviceName}</Text>
              </View>
              <View style={styles.petInfo}>
                <Ionicons name="paw" size={16} color="#FF6B9D" />
                <Text style={styles.petName}>{item.petName}</Text>
              </View>
            </View>

            {/* DateTime Info */}
            <View style={styles.datetimeInfo}>
              <View style={styles.datetimeItem}>
                <Ionicons name="calendar-outline" size={16} color="#3498DB" />
                <Text style={styles.datetimeText}>{item.appointmentDate}</Text>
              </View>
              <View style={styles.datetimeItem}>
                <Ionicons name="time-outline" size={16} color="#F39C12" />
                <Text style={styles.datetimeText}>{item.appointmentTime}</Text>
              </View>
            </View>

            {/* Doctor Info */}
            <View style={styles.doctorInfo}>
              <Ionicons name="person-outline" size={16} color="#27AE60" />
              <Text style={styles.doctorText}>{item.doctorName || 'Chưa chỉ định'}</Text>
            </View>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
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
        Không có thông báo nào trong 10 ngày gần đây.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#2c3e50" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Thông báo</Text>
      <View style={styles.headerRight}>
        <Ionicons name="notifications" size={24} color="#007bff" />
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
            data={appointments}
            keyExtractor={(item: Appointment) => item.appointmentId?.toString()}
            renderItem={renderNotificationCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadAppointments(true)}
                colors={['#007bff']}
                tintColor="#007bff"
                title="Đang làm mới..."
                titleColor="#007bff"
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}

        {/* Modal chi tiết lịch hẹn */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Modal */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết lịch hẹn</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close-circle" size={32} color="#007bff" />
                  </TouchableOpacity>
                </View>

                {selectedAppointment && (
                  <View>
                    {/* Status Badge */}
                    <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedAppointment.status) }]}>
                      <Ionicons name={getStatusIcon(selectedAppointment.status)} size={20} color="white" />
                      <Text style={styles.modalStatusText}>{getStatusText(selectedAppointment.status)}</Text>
                    </View>

                    {/* Service Info */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Ionicons name="medical" size={24} color="#007bff" />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Dịch vụ</Text>
                          <Text style={styles.detailValue}>{selectedAppointment.serviceName}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Pet Info */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Ionicons name="paw" size={24} color="#FF6B9D" />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Thú cưng</Text>
                          <Text style={styles.detailValue}>{selectedAppointment.petName}</Text>
                          {selectedAppointment.petSpecies && (
                            <Text style={styles.detailSubValue}>Loài: {selectedAppointment.petSpecies}</Text>
                          )}
                          {selectedAppointment.petAge && (
                            <Text style={styles.detailSubValue}>Tuổi: {selectedAppointment.petAge}</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Date & Time */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={24} color="#3498DB" />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Ngày hẹn</Text>
                          <Text style={styles.detailValue}>{selectedAppointment.appointmentDate}</Text>
                        </View>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={24} color="#F39C12" />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Giờ hẹn</Text>
                          <Text style={styles.detailValue}>{selectedAppointment.appointmentTime}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Doctor Info */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={24} color="#27AE60" />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Bác sĩ</Text>
                          <Text style={styles.detailValue}>{selectedAppointment.doctorName || 'Chưa chỉ định'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Notes */}
                    {selectedAppointment.notes && (
                      <View style={styles.detailSection}>
                        <View style={styles.detailRow}>
                          <Ionicons name="document-text-outline" size={24} color="#9B59B6" />
                          <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Ghi chú</Text>
                            <Text style={styles.detailValue}>{selectedAppointment.notes}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Price */}
                    {selectedAppointment.servicePrice && (
                      <View style={styles.detailSection}>
                        <View style={styles.detailRow}>
                          <Ionicons name="cash-outline" size={24} color="#E67E22" />
                          <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Giá dịch vụ</Text>
                            <Text style={styles.detailValuePrice}>
                              {selectedAppointment.servicePrice.toLocaleString('vi-VN')} đ
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Đóng</Text>
                </TouchableOpacity>
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
    width: 36,
    alignItems: 'center',
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
  
  // Notification Card
  notificationCardContainer: {
    marginBottom: 16,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  unviewedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mainInfo: {
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petName: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 6,
    fontWeight: '500',
  },
  datetimeInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 16,
  },
  datetimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datetimeText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 6,
    fontWeight: '500',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 6,
    fontWeight: '500',
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
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
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
  },
  modalStatusText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  detailSection: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    lineHeight: 22,
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  detailValuePrice: {
    fontSize: 20,
    color: '#27ae60',
    fontWeight: '700',
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
}); 