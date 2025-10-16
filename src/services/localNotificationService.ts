import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Key để lưu trữ thông báo đã xem
const VIEWED_NOTIFICATIONS_KEY = '@viewed_notifications';

/**
 * Setup notification channel cho Android
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thông báo ThuYBinhDuong',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007bff',
      sound: 'default',
      description: 'Thông báo về lịch hẹn và dịch vụ thú y',
    });
  }
}

/**
 * Tạo local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  try {
    console.log('🔔 Creating local notification:', { title, body, data });
    
    // Check permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.error('❌ Cannot create notification: No permissions');
      return false;
    }
    
    await setupNotificationChannel();
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null = hiển thị ngay lập tức
    });
    
    console.log('✅ Local notification created successfully with ID:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error creating local notification:', error);
    return false;
  }
}

/**
 * Check và tạo thông báo cho appointments mới
 */
export async function checkForNewAppointmentNotifications() {
  try {
    // ✅ Kiểm tra token trước khi gọi API
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      // Không có token = chưa đăng nhập, không cần thông báo
      return 0;
    }
    
    console.log('🔍 Checking for new appointment notifications...');
    
    // Get viewed notifications from storage
    const stored = await AsyncStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    const viewedNotifications = stored ? new Set(JSON.parse(stored)) : new Set();
    
    // Get NOTIFIED appointments from storage (đã tạo notification rồi)
    const NOTIFIED_KEY = '@notified_appointments';
    const notifiedStored = await AsyncStorage.getItem(NOTIFIED_KEY);
    const notifiedAppointments = notifiedStored ? new Set(JSON.parse(notifiedStored)) : new Set();
    
    // Get appointments from API
    const res = await apiClient.get('/Appointment', { params: { limit: 50, page: 1 } });
    const all = res.data.appointments || res.data || [];
    
    // Tính ngày 10 ngày trước
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    // Filter appointments trong 10 ngày gần đây với status 1 hoặc 3
    const recentAppointments = all.filter((item: any) => {
      if (item.status !== 1 && item.status !== 3) return false;
      
      const appointmentDate = new Date(`${item.appointmentDate} ${item.appointmentTime}`);
      return appointmentDate >= tenDaysAgo;
    });
    
    // Tìm appointments CHƯA ĐƯỢC TẠO NOTIFICATION (chưa notify, không phải chưa xem)
    const unnotifiedAppointments = recentAppointments.filter(
      (item: any) => !notifiedAppointments.has(item.appointmentId)
    );
    
    console.log(`📊 Found ${recentAppointments.length} recent appointments, ${unnotifiedAppointments.length} need notifications`);
    
    // Tạo thông báo cho appointments chưa được notify
    let createdCount = 0;
    for (const appointment of unnotifiedAppointments) {
      const statusText = appointment.status === 1 ? 'đã được xác nhận' : 'đã bị hủy';
      const emoji = appointment.status === 1 ? '✅' : '❌';
      
      const success = await scheduleLocalNotification(
        `${emoji} Lịch hẹn ${statusText}`,
        `Lịch hẹn ${appointment.serviceName} cho ${appointment.petName} vào ngày ${appointment.appointmentDate} lúc ${appointment.appointmentTime} ${statusText}.`,
        {
          type: 'appointment_update',
          appointmentId: appointment.appointmentId,
          status: appointment.status,
          serviceName: appointment.serviceName,
          petName: appointment.petName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
        }
      );
      
      if (success) {
        // Đánh dấu đã tạo thông báo (để không tạo lại)
        notifiedAppointments.add(appointment.appointmentId);
        createdCount++;
        console.log(`✅ Created notification for appointment ${appointment.appointmentId}`);
      }
    }
    
    // Lưu danh sách đã notify
    await AsyncStorage.setItem(
      NOTIFIED_KEY,
      JSON.stringify(Array.from(notifiedAppointments))
    );
    
    if (createdCount > 0) {
      console.log(`🔔 Created ${createdCount} new local notifications`);
    }
    
    return createdCount;
  } catch (error: any) {
    // Im lặng lỗi 401 (Unauthorized)
    if (error?.response?.status !== 401) {
      console.error('❌ Error checking for new notifications:', error);
    }
    return 0;
  }
}

/**
 * Đánh dấu thông báo đã xem
 */
export async function markNotificationAsViewed(appointmentId: number) {
  try {
    const stored = await AsyncStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    const viewedNotifications = stored ? new Set(JSON.parse(stored)) : new Set();
    
    viewedNotifications.add(appointmentId);
    
    await AsyncStorage.setItem(
      VIEWED_NOTIFICATIONS_KEY,
      JSON.stringify(Array.from(viewedNotifications))
    );
    
    console.log(`✅ Marked appointment ${appointmentId} as viewed`);
  } catch (error) {
    console.error('❌ Error marking notification as viewed:', error);
  }
}

/**
 * Lấy số lượng thông báo chưa xem
 */
export async function getUnviewedNotificationCount(): Promise<number> {
  try {
    // ✅ Kiểm tra token trước khi gọi API
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      // Không có token = chưa đăng nhập, không cần thông báo
      return 0;
    }
    
    const stored = await AsyncStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    const viewedNotifications = stored ? new Set(JSON.parse(stored)) : new Set();
    
    const res = await apiClient.get('/Appointment', { params: { limit: 50, page: 1 } });
    const all = res.data.appointments || res.data || [];
    
    // Tính ngày 10 ngày trước
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    // Filter appointments trong 10 ngày gần đây với status 1 hoặc 3
    const recentAppointments = all.filter((item: any) => {
      if (item.status !== 1 && item.status !== 3) return false;
      
      const appointmentDate = new Date(`${item.appointmentDate} ${item.appointmentTime}`);
      return appointmentDate >= tenDaysAgo;
    });
    
    // Đếm appointments chưa xem
    const unviewedCount = recentAppointments.filter(
      (item: any) => !viewedNotifications.has(item.appointmentId)
    ).length;
    
    return unviewedCount;
  } catch (error: any) {
    // Im lặng lỗi 401 (Unauthorized)
    if (error?.response?.status !== 401) {
      console.error('❌ Error getting unviewed notification count:', error);
    }
    return 0;
  }
}

/**
 * Tạo thông báo test
 */
export async function createTestNotification() {
  console.log('🧪 Creating test notification...');
  
  const success = await scheduleLocalNotification(
    '🧪 Test Notification',
    'Đây là thông báo test từ ThuYBinhDuong app. Local notifications đang hoạt động tốt!',
    {
      type: 'test',
      timestamp: new Date().toISOString(),
    }
  );
  
  if (success) {
    console.log('✅ Test notification created successfully');
  } else {
    console.error('❌ Failed to create test notification');
  }
  
  return success;
}

/**
 * Xóa tất cả thông báo đã lên lịch
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Cancelled all scheduled notifications');
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
  }
}

/**
 * Clear notified appointments list (for debugging)
 */
export async function clearNotifiedAppointments() {
  try {
    await AsyncStorage.removeItem('@notified_appointments');
    console.log('✅ Cleared notified appointments list');
  } catch (error) {
    console.error('❌ Error clearing notified appointments:', error);
  }
}

/**
 * Lấy quyền thông báo
 */
export async function requestNotificationPermissions() {
  try {
    console.log('🔐 Checking notification permissions...');
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('🔐 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 New permission status:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted. Status:', finalStatus);
      return false;
    }
    
    console.log('✅ Notification permissions granted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}
