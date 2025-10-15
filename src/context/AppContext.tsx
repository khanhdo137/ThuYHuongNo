import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: number;
  token: string;
}

interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  appVersion: string;
  lastSyncTime: Date | null;
}

interface AppContextType {
  // App State
  appState: AppState;
  setAppState: (state: Partial<AppState>) => void;
  
  // User State
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  
  // App Actions
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  
  // Utility
  clearStorage: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // App State
  const [appState, setAppStateInternal] = useState<AppState>({
    isLoading: true,
    isOnline: true,
    appVersion: '1.0.0',
    lastSyncTime: null,
  });

  // User State
  const [user, setUserInternal] = useState<User | null>(null);

  // Computed values
  const isAuthenticated = !!user?.token;

  // App State Management
  const setAppState = (newState: Partial<AppState>) => {
    setAppStateInternal(prev => ({ ...prev, ...newState }));
  };

  // User Management
  const setUser = (newUser: User | null) => {
    setUserInternal(newUser);
  };

  // Login function
  const login = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', userData.token);
      setUser(userData);
      setAppState({ lastSyncTime: new Date() });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      setAppState({ lastSyncTime: null });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update user function
  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Clear storage function
  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      setAppState({ 
        isLoading: false, 
        lastSyncTime: null 
      });
    } catch (error) {
      console.error('Clear storage error:', error);
      throw error;
    }
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for stored user data
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
        
        setAppState({ isLoading: false });
      } catch (error) {
        console.error('App initialization error:', error);
        setAppState({ isLoading: false });
      }
    };

    initializeApp();
  }, []);

  // Network status listener
  useEffect(() => {
    // You can add network status listener here
    // For now, we'll assume the app is always online
    setAppState({ isOnline: true });
  }, []);

  const contextValue: AppContextType = {
    appState,
    setAppState,
    user,
    setUser,
    isAuthenticated,
    login,
    logout,
    updateUser,
    clearStorage,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use AppContext
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
