import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NotificationCountProvider } from './context/NotificationCountContext';
import AppNavigator from './navigation/AppNavigator';
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export default function App() {
  return (
    <NotificationCountProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
          <PaperProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </NotificationCountProvider>
  );
} 