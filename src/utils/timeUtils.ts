/**
 * Utility functions for time formatting in Vietnam timezone
 */

/**
 * Format a date string to Vietnam timezone
 * @param dateString - ISO date string from API
 * @returns Formatted date string in Vietnam timezone
 */
export const formatVietnamTime = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting Vietnam time:', error);
    return dateString;
  }
};

/**
 * Format a date string to Vietnam timezone for display in chat messages
 * @param dateString - ISO date string from API
 * @returns Formatted time string (HH:mm DD/MM/YYYY)
 */
export const formatVietnamChatTime = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting Vietnam chat time:', error);
    return dateString;
  }
};

/**
 * Get current Vietnam time
 * @returns Current date in Vietnam timezone
 */
export const getCurrentVietnamTime = (): Date => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

/**
 * Format relative time (e.g., "2 phút trước", "1 giờ trước")
 * @param dateString - ISO date string from API
 * @returns Relative time string in Vietnamese
 */
export const formatRelativeVietnamTime = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = getCurrentVietnamTime();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    }
  } catch (error) {
    console.error('Error formatting relative Vietnam time:', error);
    return dateString;
  }
};
