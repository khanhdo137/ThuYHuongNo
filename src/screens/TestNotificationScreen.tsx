import React, { useState } from 'react';
import { View, Button, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { setupNotificationChannel } from '../services/localNotificationService';

export const TestNotificationScreen = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev]);
    console.log(message);
  };

  const testNotification = async () => {
    try {
      addLog('🧪 Starting notification test...');
      
      // Check current permission
      const { status: currentStatus } = await Notifications.getPermissionsAsync();
      addLog(`📋 Current permission: ${currentStatus}`);
      
      if (currentStatus !== 'granted') {
        addLog('⚠️ Requesting permission...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        addLog(`📋 New permission: ${newStatus}`);
        
        if (newStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Vui lòng bật quyền thông báo trong Settings');
          addLog('❌ Permission denied by user');
          return;
        }
      }

      // Setup channel
      addLog('⚙️ Setting up notification channel...');
      await setupNotificationChannel();
      
      // Schedule notification
      addLog('📤 Sending notification...');
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'Notification này NÊN hiển thị ở status bar!',
          data: { test: true },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Immediate
      });
      
      addLog(`✅ Notification sent with ID: ${notificationId}`);
      addLog('📲 Kiểm tra status bar / notification tray!');
      
      Alert.alert(
        'Notification Sent!',
        'Nếu không thấy ở status bar:\n1. Minimize app\n2. Kiểm tra lại\n\nNOTE: Notification chỉ hiển thị ở status bar khi app ở background!'
      );
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      console.error('Test error:', error);
      Alert.alert('Error', JSON.stringify(error));
    }
  };

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    addLog(`📋 Permission status: ${status}`);
    Alert.alert('Permission Status', status);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Test Notifications</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="📤 Send Test Notification" onPress={testNotification} />
        <View style={styles.spacer} />
        <Button title="🔍 Check Permission" onPress={checkPermission} />
        <View style={styles.spacer} />
        <Button title="🗑️ Clear Logs" onPress={clearLogs} />
      </View>

      <Text style={styles.infoText}>
        ⚠️ Lưu ý: Notification chỉ hiển thị ở status bar khi app đang ở BACKGROUND.
        {'\n'}
        Sau khi nhấn "Send", hãy minimize app và kiểm tra!
      </Text>

      <ScrollView style={styles.logsContainer}>
        <Text style={styles.logsTitle}>📝 Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logItem}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  spacer: {
    height: 10,
  },
  infoText: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
    color: '#856404',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logItem: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
    color: '#333',
  },
});










