import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { 
  requestNotificationPermissions, 
  setupNotificationChannel,
  clearNotifiedAppointments,
  checkForNewAppointmentNotifications 
} from '../services/localNotificationService';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationDebugButtonProps {
  style?: any;
}

export default function NotificationDebugButton({ style }: NotificationDebugButtonProps) {
  const handleDebugPermissions = async () => {
    try {
      console.log('🔍 Debugging notification permissions...');
      
      // Check current permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log('📋 Current permission status:', status);
      
      // Request permissions
      const hasPermission = await requestNotificationPermissions();
      
      // Setup channel
      await setupNotificationChannel();
      
      // Check storage
      const viewedStored = await AsyncStorage.getItem('@viewed_notifications');
      const notifiedStored = await AsyncStorage.getItem('@notified_appointments');
      const viewedCount = viewedStored ? JSON.parse(viewedStored).length : 0;
      const notifiedCount = notifiedStored ? JSON.parse(notifiedStored).length : 0;
      
      // Show debug info
      Alert.alert(
        '🔍 Debug Info',
        `Permission: ${status}\nHas Permission: ${hasPermission ? 'Yes' : 'No'}\n\nViewed: ${viewedCount} appointments\nNotified: ${notifiedCount} appointments\n\nCheck console for details.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error debugging permissions:', error);
      Alert.alert(
        '❌ Debug Error',
        `Error: ${error}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleResetNotifications = async () => {
    Alert.alert(
      '🔄 Reset Notifications',
      'Xóa danh sách đã notify để test lại?\n\nSau khi reset, close và mở lại app để tạo notifications mới.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearNotifiedAppointments();
              Alert.alert(
                '✅ Thành công',
                'Đã reset! Close app và mở lại để thấy notifications.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('❌ Lỗi', `${error}`, [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const handleCheckNow = async () => {
    try {
      console.log('🔍 Manually checking for new notifications...');
      const count = await checkForNewAppointmentNotifications();
      Alert.alert(
        '✅ Đã kiểm tra',
        `Tạo ${count} notification mới!\n\nKiểm tra thanh trạng thái của điện thoại.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('❌ Lỗi', `${error}`, [{ text: 'OK' }]);
    }
  };

  return (
    <View style={{ flexDirection: 'column', gap: 5 }}>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handleDebugPermissions}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>🔍 Debug Info</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.checkButton, style]}
        onPress={handleCheckNow}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>🔔 Check Now</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.resetButton, style]}
        onPress={handleResetNotifications}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>🔄 Reset Notify List</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 3,
  },
  checkButton: {
    backgroundColor: '#007bff',
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
