import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationCountProvider, useNotificationCount } from './context/NotificationCountContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';
import {
  checkForNewAppointmentNotifications,
  getUnviewedNotificationCount,
  markNotificationAsViewed,
  requestNotificationPermissions,
  setupNotificationChannel,
} from './services/localNotificationService';
import apiClient from './api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kiểm tra xem có đang chạy trong Expo Go không
const isExpoGo = Constants.appOwnership === 'expo';

// Component to handle theme-based styling
const ThemedApp = () => {
  const { theme } = useTheme();
  const { setCount } = useNotificationCount();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Function to refresh notification count
  const refreshNotificationCount = async () => {
    try {
      // ✅ Kiểm tra token trước khi gọi API
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // Không có token = chưa đăng nhập, không cần thông báo lỗi
        setCount(0);
        return;
      }
      
      console.log('🔄 App.tsx - Refreshing notification count...');
      
      // Get viewed notifications from storage
      const viewedNotificationsKey = '@viewed_notifications';
      const stored = await AsyncStorage.getItem(viewedNotificationsKey);
      const viewedNotifications = stored ? new Set(JSON.parse(stored)) : new Set();
      
      // Get appointments from API
      const res = await apiClient.get('/Appointment', { params: { limit: 50, page: 1 } });
      const all = res.data.appointments || res.data || [];
      
      // Tính ngày 10 ngày trước
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      // Filter appointments with status 1 (confirmed) or 3 (cancelled) trong 10 ngày gần đây
      const filtered = all.filter((item: any) => {
        // Check status
        if (item.status !== 1 && item.status !== 3) return false;
        
        // Check date - chỉ lấy trong 10 ngày gần đây
        const appointmentDate = new Date(`${item.appointmentDate} ${item.appointmentTime}`);
        return appointmentDate >= tenDaysAgo;
      });
      
      // Count unviewed notifications
      const unviewedCount = filtered.filter(
        (item: any) => !viewedNotifications.has(item.appointmentId)
      ).length;
      
      console.log(`🔔 App.tsx - Found ${filtered.length} appointments (last 10 days), ${unviewedCount} unviewed`);
      setCount(unviewedCount);
    } catch (error: any) {
      // Im lặng lỗi 401 (Unauthorized)
      if (error?.response?.status !== 401) {
        console.error('Error refreshing notification count:', error);
      }
      setCount(0);
    }
  };

  useEffect(() => {
    // 🔔 Setup Local Notifications
    const setupLocalNotifications = async () => {
      try {
        // Skip trong Expo Go
        if (isExpoGo) {
          console.warn('⚠️ Notifications not available in Expo Go - use development build for notifications');
          return;
        }
        
        console.log('🔧 Setting up local notifications...');
        
        // Request permissions
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          console.warn('⚠️ Notification permissions not granted - notifications will not work');
          return;
        }

        // Setup notification channel
        console.log('📱 Setting up notification channel...');
        await setupNotificationChannel();

        // 🔔 Lắng nghe khi nhận notification (app đang mở)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('🔔 Local notification received:', notification);
          const { title, body } = notification.request.content;
          console.log(`📱 Notification received: ${title} - ${body}`);
          
          // Refresh notification count when receiving notification
          refreshNotificationCount();
        });

        // 👆 Lắng nghe khi user tap vào notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('👆 Local notification tapped:', response);
          
          const data = response.notification.request.content.data;
          
          // Navigate dựa vào type của notification
          if (data?.type === 'appointment_update') {
            console.log('🧭 Navigating to NotificationScreen');
            navigationRef.current?.navigate('NotificationScreen' as never);
          } else if (data?.type === 'chat_message') {
            console.log('🧭 Navigating to ChatBot');
            navigationRef.current?.navigate('ChatBot' as never);
          }
        });

        console.log('✅ Local notifications setup completed successfully');
      } catch (error) {
        console.warn('⚠️ Error setting up local notifications:', error);
      }
    };

    // 🔄 Auto-refresh notification count when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active - checking for new notifications');
        checkForNewAppointmentNotifications();
        refreshNotificationCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Setup notifications and initial load
    setupLocalNotifications();
    refreshNotificationCount();

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription?.remove();
    };
  }, []);
  
  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background 
      }} 
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      <PaperProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationCountProvider>
            <SafeAreaProvider>
              <ThemedApp />
            </SafeAreaProvider>
          </NotificationCountProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppProvider>
  );
} 