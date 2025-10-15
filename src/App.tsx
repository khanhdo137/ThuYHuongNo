import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationCountProvider } from './context/NotificationCountContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

// Component to handle theme-based styling
const ThemedApp = () => {
  const { theme } = useTheme();
  
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
        <NavigationContainer>
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