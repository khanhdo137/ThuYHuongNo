import apiClient from './client';

export interface Notification {
  notificationId: number;
  title: string;
  body: string;
  type?: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Lấy danh sách notifications
 */
const getNotifications = async (
  page: number = 1, 
  limit: number = 20,
  isRead?: boolean
): Promise<NotificationsResponse> => {
  try {
    const params: any = { page, limit };
    if (isRead !== undefined) {
      params.isRead = isRead;
    }
    
    const response = await apiClient.get('/notification', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Lấy số lượng notifications chưa đọc
 */
const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/notification/unread-count');
    return response.data.unreadCount;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Đánh dấu một notification đã đọc
 */
const markAsRead = async (notificationId: number): Promise<void> => {
  try {
    await apiClient.patch(`/notification/${notificationId}/read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Đánh dấu tất cả notifications đã đọc
 */
const markAllAsRead = async (): Promise<void> => {
  try {
    await apiClient.post('/notification/read-all');
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Xóa một notification
 */
const deleteNotification = async (notificationId: number): Promise<void> => {
  try {
    await apiClient.delete(`/notification/${notificationId}`);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Export as object (default export)
const notificationApi = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

// Named exports for direct import
export { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };

export default notificationApi;

