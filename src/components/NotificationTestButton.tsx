import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { createTestNotification } from '../services/localNotificationService';

interface NotificationTestButtonProps {
  style?: any;
}

export default function NotificationTestButton({ style }: NotificationTestButtonProps) {
  const handleTestNotification = async () => {
    try {
      console.log('🧪 User tapped test notification button');
      
      const success = await createTestNotification();
      
      if (success) {
        Alert.alert(
          '✅ Thành công',
          'Thông báo test đã được tạo! Kiểm tra thanh trạng thái của điện thoại.\n\nNếu không thấy thông báo:\n1. Kiểm tra quyền thông báo\n2. Kiểm tra Do Not Disturb mode\n3. Kiểm tra console logs',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Thất bại',
          'Không thể tạo thông báo test. Vui lòng kiểm tra:\n\n1. Quyền thông báo\n2. Console logs\n3. App permissions',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      Alert.alert(
        '❌ Lỗi',
        `Lỗi khi tạo thông báo test: ${error}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleTestNotification}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>🧪 Test Local Notification</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
