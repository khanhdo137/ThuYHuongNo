import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useApp, useAuth, useTheme, useNotificationCount } from '../context';

// Example component showing how to use all contexts
const ContextExample: React.FC = () => {
  // Use all contexts
  const { appState, setAppState, user, isAuthenticated } = useApp();
  const { login, logout, error, isLoading } = useAuth();
  const { theme, toggleTheme, setThemeMode } = useTheme();
  const { count, setCount } = useNotificationCount();

  // Example login function
  const handleLogin = async () => {
    try {
      await login('testuser', 'password');
      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Login failed');
    }
  };

  // Example logout function
  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('Success', 'Logout successful!');
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  // Example theme toggle
  const handleThemeToggle = async () => {
    try {
      await toggleTheme();
    } catch (error) {
      Alert.alert('Error', 'Failed to change theme');
    }
  };

  // Example notification count update
  const handleNotificationUpdate = () => {
    setCount(count + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Context Example
      </Text>

      {/* App State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          App State
        </Text>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Loading: {appState.isLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Online: {appState.isOnline ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Version: {appState.appVersion}
        </Text>
      </View>

      {/* Auth State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Authentication
        </Text>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Authenticated: {isAuthenticated ? 'Yes' : 'No'}
        </Text>
        {user && (
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            User: {user.username}
          </Text>
        )}
        {error && (
          <Text style={[styles.text, { color: theme.colors.error }]}>
            Error: {error}
          </Text>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.error }]}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Theme
        </Text>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Mode: {theme.mode}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Dark: {theme.isDark ? 'Yes' : 'No'}
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.secondary }]}
            onPress={handleThemeToggle}
          >
            <Text style={styles.buttonText}>Toggle Theme</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.info }]}
            onPress={() => setThemeMode('system')}
          >
            <Text style={styles.buttonText}>System</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Notifications
        </Text>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Count: {count}
        </Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.warning }]}
          onPress={handleNotificationUpdate}
        >
          <Text style={styles.buttonText}>Add Notification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ContextExample;
