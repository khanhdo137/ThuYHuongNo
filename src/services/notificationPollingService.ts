import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUnreadCount, getNotifications } from '../api/notificationApi';
import { presentNotificationNow } from './localNotificationService';

let pollingInterval: ReturnType<typeof setInterval> | null = null;
let lastUnreadCount = 0;
const NOTIFIED_IDS_KEY = '@notified_notification_ids';

/**
 * Bắt đầu polling để check notifications mới
 * Mặc định poll mỗi 15 giây để phát hiện notification mới nhanh hơn
 */
export const startNotificationPolling = async (intervalMs: number = 15000) => {
  // Stop existing polling
  stopNotificationPolling();
  
  console.log(`🔔 Starting notification polling (interval: ${intervalMs}ms)...`);
  
  // Initialize last unread count
  try {
    lastUnreadCount = await getUnreadCount();
    console.log(`📊 Initial unread count: ${lastUnreadCount}`);
  } catch (error) {
    console.warn('⚠️ Could not get initial unread count:', error);
  }
  
  // Initial check ngay lập tức
  console.log('🔍 Performing initial notification check...');
  await checkForNewNotifications();
  
  // Set up interval để check định kỳ
  pollingInterval = setInterval(async () => {
    await checkForNewNotifications();
  }, intervalMs);
  
  console.log(`✅ Notification polling started. Will check every ${intervalMs / 1000} seconds.`);
};

/**
 * Dừng polling
 */
export const stopNotificationPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('🔕 Stopped notification polling');
  }
};

/**
 * Check notifications mới và hiển thị local notification
 * Export để có thể gọi từ bên ngoài (ví dụ khi app active)
 */
export const checkForNewNotifications = async () => {
  try {
    // Kiểm tra token trước
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return; // Chưa đăng nhập, không cần check
    }

    // Lấy danh sách notifications mới (chưa đọc)
    const response = await getNotifications(1, 50, false); // Chỉ lấy unread
    const unreadNotifications = response.notifications || [];
    
    // Lấy danh sách notification IDs đã tạo local notification
    const notifiedIdsStored = await AsyncStorage.getItem(NOTIFIED_IDS_KEY);
    const notifiedIds = notifiedIdsStored ? new Set<number>(JSON.parse(notifiedIdsStored)) : new Set<number>();
    
    // Tìm notifications mới chưa được tạo local notification
    const newNotifications = unreadNotifications.filter(
      (notif: any) => !notifiedIds.has(notif.notificationId)
    );
    
    console.log(`📊 Found ${unreadNotifications.length} unread notifications, ${newNotifications.length} new`);
    
    // Tạo local notification cho mỗi notification mới (mỗi notification chỉ gửi 1 lần)
    for (const notification of newNotifications) {
      try {
        console.log(`🔔 Creating local notification for: ${notification.title}`);
        console.log(`📝 Notification body: ${notification.body}`);
        console.log(`🆔 Notification ID: ${notification.notificationId}`);
        
        // Sử dụng presentNotificationNow để hiển thị ngay lập tức
        const success = await presentNotificationNow(
          notification.title || '🔔 Thông báo mới',
          notification.body || 'Bạn có thông báo mới từ phòng khám',
          {
            type: notification.type || 'notification',
            notificationId: notification.notificationId,
            ...(notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : {}),
          }
        );
        
        if (success) {
          // Đánh dấu đã tạo notification để không gửi lại
          notifiedIds.add(notification.notificationId);
          console.log(`✅ Created local notification for ID: ${notification.notificationId}`);
        } else {
          console.warn(`⚠️ Failed to create notification for ID ${notification.notificationId} - permission or other issue`);
        }
      } catch (notifError) {
        console.error(`❌ Failed to create notification for ID ${notification.notificationId}:`, notifError);
      }
    }
    
    // Lưu danh sách đã notify
    if (newNotifications.length > 0) {
      await AsyncStorage.setItem(
        NOTIFIED_IDS_KEY,
        JSON.stringify(Array.from(notifiedIds))
      );
    }
    
    // Cập nhật last unread count
    lastUnreadCount = unreadNotifications.length;
    
  } catch (error: any) {
    // Im lặng lỗi 401 (Unauthorized)
    if (error?.response?.status !== 401) {
      console.error('❌ Error checking for new notifications:', error);
    }
  }
};

/**
 * Reset last unread count (gọi sau khi user đọc notifications)
 */
export const resetUnreadCount = async () => {
  try {
    lastUnreadCount = await getUnreadCount();
    // Xóa danh sách đã notify để có thể tạo lại nếu cần
    await AsyncStorage.removeItem(NOTIFIED_IDS_KEY);
  } catch (error) {
    console.error('Error resetting unread count:', error);
  }
};

/**
 * Clear notified IDs (for debugging)
 */
export const clearNotifiedIds = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFIED_IDS_KEY);
    console.log('✅ Cleared notified notification IDs');
  } catch (error) {
    console.error('❌ Error clearing notified IDs:', error);
  }
};


