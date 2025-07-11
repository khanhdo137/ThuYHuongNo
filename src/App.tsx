import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { Provider as PaperProvider } from 'react-native-paper';
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export default function App() {
  return (
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
  );
} 