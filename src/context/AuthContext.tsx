import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { startNotificationPolling, stopNotificationPolling } from '../services/notificationPollingService';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: number;
  token: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User['profile']>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Check reminders when app starts
          try {
            await client.post('/Reminder/check-my-reminders');
            console.log('✅ Checked appointment reminders on app start');
          } catch (reminderError) {
            console.warn('⚠️ Failed to check reminders:', reminderError);
          }
          
          // Start notification polling if user is authenticated
          // Poll mỗi 15 giây để phát hiện notification mới nhanh hơn
          await startNotificationPolling(15000);
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await client.post('/User/login', {
        username,
        password,
      });

      const { userId, username: responseUsername, role, token } = response.data;
      
      const user: User = {
        id: userId,
        username: responseUsername,
        email: '', // You might want to get this from the response
        role,
        token,
      };

      // Save to storage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // Check reminders sau khi login
      try {
        await client.post('/Reminder/check-my-reminders');
        console.log('✅ Checked appointment reminders');
      } catch (reminderError) {
        console.warn('⚠️ Failed to check reminders:', reminderError);
      }
      
      // Start notification polling after successful login
      // Poll mỗi 15 giây để phát hiện notification mới nhanh hơn
      await startNotificationPolling(15000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await client.post('/User/register', userData);
      
      // After successful registration, you might want to auto-login
      // or redirect to login screen
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Stop notification polling
      stopNotificationPolling();
      
      // Call logout API if needed
      if (authState.user?.token) {
        try {
          await client.post('/User/logout');
        } catch (error) {
          console.warn('Logout API call failed:', error);
        }
      }

      // Clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<User['profile']>) => {
    if (!authState.user) return;

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await client.put('/User/profile', profileData);
      
      const updatedUser = {
        ...authState.user,
        profile: { ...authState.user.profile, ...profileData },
      };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Change password function
  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await client.put('/User/change-password', {
        oldPassword,
        newPassword,
      });
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Clear error function
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await client.post('/User/refresh-token');
      const { token } = response.data;
      
      if (authState.user) {
        const updatedUser = { ...authState.user, token };
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 