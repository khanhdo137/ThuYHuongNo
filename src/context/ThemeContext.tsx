import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Types
export type ThemeMode = 'light' | 'dark' | 'system';

interface Colors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
}

interface Theme {
  mode: ThemeMode;
  colors: Colors;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

// Light theme colors
const lightColors: Colors = {
  primary: '#42A5F5',
  secondary: '#FF6B9D',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  tabBar: '#FFFFFF',
  tabBarActive: '#42A5F5',
  tabBarInactive: '#9E9E9E',
};

// Dark theme colors
const darkColors: Colors = {
  primary: '#64B5F6',
  secondary: '#FF8A9B',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  error: '#CF6679',
  success: '#81C784',
  warning: '#FFB74D',
  info: '#64B5F6',
  tabBar: '#1E1E1E',
  tabBarActive: '#64B5F6',
  tabBarInactive: '#757575',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine if theme should be dark
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  
  // Get current colors based on theme
  const colors = isDark ? darkColors : lightColors;

  const theme: Theme = {
    mode: themeMode,
    colors,
    isDark,
  };

  // Load saved theme mode
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadThemeMode();
  }, []);

  // Set theme mode
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
      throw error;
    }
  };

  // Toggle between light and dark
  const toggleTheme = async () => {
    const newMode = isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme,
    setThemeMode,
    toggleTheme,
  };

  // Don't render until theme is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use ThemeContext
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
