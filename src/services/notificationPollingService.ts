import { getUnreadCount } from '../api/notificationApi';
import { scheduleLocalNotification } from './localNotificationService';

let pollingInterval: NodeJS.Timeout | null = null;
let lastUnreadCount = 0;

/**
 * Bắt đầu polling để check notifications mới
 */
export const startNotificationPolling = async (intervalMs: number = 30000) => {
  // Stop existing polling
  stopNotificationPolling();
  
  console.log('🔔 Starting notification polling...');
  
  // Initial check
  await checkForNewNotifications();
  
  // Set up interval
  pollingInterval = setInterval(async () => {
    await checkForNewNotifications();
  }, intervalMs);
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
 */
const checkForNewNotifications = async () => {
  try {
    const currentUnreadCount = await getUnreadCount();
    
    console.log(`📊 Unread count: ${currentUnreadCount} (previous: ${lastUnreadCount})`);
    
    // Nếu có notification mới
    if (currentUnreadCount > lastUnreadCount) {
      const newNotificationsCount = currentUnreadCount - lastUnreadCount;
      
      console.log(`🔔 Triggering notification for ${newNotificationsCount} new notification(s)`);
      
      // Trigger local notification
      try {
        await scheduleLocalNotification(
          '🔔 Thông báo mới',
          newNotificationsCount === 1 
            ? 'Bạn có 1 thông báo mới từ phòng khám' 
            : `Bạn có ${newNotificationsCount} thông báo mới từ phòng khám`,
          { 
            type: 'new_notifications',
            count: newNotificationsCount 
          }
        );
        console.log('✅ Local notification scheduled successfully');
      } catch (notifError) {
        console.error('❌ Failed to schedule notification:', notifError);
      }
    }
    
    lastUnreadCount = currentUnreadCount;
  } catch (error) {
    console.error('❌ Error checking for new notifications:', error);
  }
};

/**
 * Reset last unread count (gọi sau khi user đọc notifications)
 */
export const resetUnreadCount = async () => {
  try {
    lastUnreadCount = await getUnreadCount();
  } catch (error) {
    console.error('Error resetting unread count:', error);
  }
};

