import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kiểm tra xem có đang chạy trong Expo Go không
const isExpoGo = Constants.appOwnership === 'expo';

// Cấu hình notification handler - LUÔN hiển thị notification ngay cả khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
 * Hiển thị notification ngay lập tức (present notification)
 * Sử dụng scheduleNotificationAsync với trigger: null để hiển thị ngay
 */
export async function presentNotificationNow(
  title: string,
  body: string,
  data?: any
) {
  try {
    console.log('🔔 Presenting notification now:', { title, body, data });
    
    // Check permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.error('❌ Cannot present notification: No permissions');
      return false;
    }
    
    await setupNotificationChannel();
    
    // Sử dụng scheduleNotificationAsync với trigger: null để hiển thị ngay lập tức
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: 1,
      },
      trigger: null, // null = hiển thị ngay lập tức
    });
    
    console.log('✅ Notification presented successfully with ID:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error presenting notification:', error);
    return false;
  }
}

/**
 * Tạo local notification (scheduled hoặc immediate)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  immediate: boolean = true
) {
  try {
    console.log('🔔 Creating local notification:', { title, body, data, immediate });
    
    // Nếu immediate = true, sử dụng presentNotificationNow để hiển thị ngay
    if (immediate) {
      return await presentNotificationNow(title, body, data);
    }
    
    // Check permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.error('❌ Cannot create notification: No permissions');
      return false;
    }
    
    await setupNotificationChannel();
    
    // Sử dụng trigger với seconds: 1 để schedule notification trong tương lai
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: 1, // Hiển thị badge trên icon
      },
      trigger: { seconds: 1 }, // Hiển thị sau 1 giây
    });
    
    console.log('✅ Local notification scheduled successfully with ID:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
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
 * Check và tạo local notification cho notifications mới từ API
 */
export async function checkForNewNotificationsFromAPI() {
  try {
    // ✅ Kiểm tra token trước khi gọi API
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return 0;
    }
    
    console.log('🔍 Checking for new notifications from API...');
    
    // Import động để tránh circular dependency
    const { getNotifications } = await import('../api/notificationApi');
    
    // Lấy danh sách notifications chưa đọc
    const response = await getNotifications(1, 50, false);
    const unreadNotifications = response.notifications || [];
    
    // Lấy danh sách notification IDs đã tạo local notification
    const NOTIFIED_IDS_KEY = '@notified_notification_ids';
    const notifiedIdsStored = await AsyncStorage.getItem(NOTIFIED_IDS_KEY);
    const notifiedIds = notifiedIdsStored ? new Set<number>(JSON.parse(notifiedIdsStored)) : new Set<number>();
    
    // Tìm notifications mới chưa được tạo local notification
    const newNotifications = unreadNotifications.filter(
      (notif: any) => !notifiedIds.has(notif.notificationId)
    );
    
    console.log(`📊 Found ${unreadNotifications.length} unread notifications, ${newNotifications.length} new`);
    
    // Tạo local notification cho mỗi notification mới
    let createdCount = 0;
    for (const notification of newNotifications) {
      const success = await presentNotificationNow(
        notification.title || '🔔 Thông báo mới',
        notification.body || 'Bạn có thông báo mới từ phòng khám',
        {
          type: notification.type || 'notification',
          notificationId: notification.notificationId,
          ...(notification.data ? JSON.parse(notification.data) : {}),
        }
      );
      
      if (success) {
        notifiedIds.add(notification.notificationId);
        createdCount++;
        console.log(`✅ Created local notification for ID: ${notification.notificationId}`);
      }
    }
    
    // Lưu danh sách đã notify
    if (newNotifications.length > 0) {
      await AsyncStorage.setItem(
        NOTIFIED_IDS_KEY,
        JSON.stringify(Array.from(notifiedIds))
      );
    }
    
    if (createdCount > 0) {
      console.log(`🔔 Created ${createdCount} new local notifications from API`);
    }
    
    return createdCount;
  } catch (error: any) {
    // Im lặng lỗi 401 (Unauthorized)
    if (error?.response?.status !== 401) {
      console.error('❌ Error checking for new notifications from API:', error);
    }
    return 0;
  }
}

/**
 * Lấy quyền thông báo
 * Cải thiện để xử lý tốt hơn cho Android 13+
 */
export async function requestNotificationPermissions() {
  try {
    console.log('🔐 Checking notification permissions...');
    
    // Lấy permissions hiện tại
    const { status: existingStatus, ...permissions } = await Notifications.getPermissionsAsync();
    console.log('📋 Current permission status:', existingStatus);
    console.log('📋 Full permissions object:', permissions);
    
    let finalStatus = existingStatus;
    
    // Nếu chưa được cấp quyền, yêu cầu quyền
    if (existingStatus !== 'granted') {
      console.log('🔐 Requesting notification permissions...');
      const { status, ...newPermissions } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
      console.log('📋 New permission status:', finalStatus);
      console.log('📋 New permissions object:', newPermissions);
    }
    
    // Kiểm tra lại permissions sau khi request
    if (finalStatus !== 'granted') {
      // Kiểm tra lại một lần nữa để chắc chắn
      const { status: recheckStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Recheck permission status:', recheckStatus);
      
      if (recheckStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted. Final status:', recheckStatus);
        return false;
      }
      finalStatus = recheckStatus;
    }
    
    console.log('✅ Notification permissions granted successfully. Status:', finalStatus);
    return true;
  } catch (error) {
    console.error('❌ Error requesting permissions:', error);
    return false;
  }
}
