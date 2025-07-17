import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationCount } from '../context/NotificationCountContext';

const TAB_HEIGHT = 60;
const ICON_SIZE = 22;
const ACTIVE_SCALE = 1.32;
const ACTIVE_TRANSLATE_Y = -16;
const ACTIVE_MARGIN_BOTTOM = 12;
const ICONS = [
  { name: 'home', lib: Ionicons, route: 'Home' },
  { name: 'phone', lib: Feather, route: 'Contact' },
  { name: 'event-available', lib: MaterialIcons, route: 'Booking' },
  { name: 'notifications', lib: Ionicons, route: 'Notification' },
  { name: 'user', lib: FontAwesome, route: 'Profile' },
];

const CustomBottomTab = ({ state, navigation }: { state: any; navigation: any }) => {
  const { count } = useNotificationCount();
  return (
    <View style={styles.container}>
      {ICONS.map((icon, idx) => {
        const isActive = state.index === idx;
        const LibIcon = icon.lib;
        return (
          <TouchableOpacity
            key={icon.route}
            style={styles.tabButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(icon.route)}
          >
            <Animated.View
              style={[
                styles.iconWrapper,
                isActive && {
                  ...styles.iconActive,
                  marginBottom: ACTIVE_MARGIN_BOTTOM,
                  backgroundColor: '#FFFFFF', // Nền icon nổi bật
                  transform: [{ scale: ACTIVE_SCALE }, { translateY: ACTIVE_TRANSLATE_Y }],
                },
                isActive && Platform.select({
                  ios: styles.shadowIOS,
                  android: styles.shadowAndroid,
                }),
              ]}
            >
              {/* Icon render */}
              {icon.lib === Ionicons && (
                <Ionicons
                  name={icon.name as any}
                  size={ICON_SIZE}
                  color={isActive ? '#42A5F5' : '#88BEC5'}
                  style={isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined}
                />
              )}
              {icon.lib === Feather && (
                <Feather
                  name={icon.name as any}
                  size={ICON_SIZE}
                  color={isActive ? '#42A5F5' : '#88BEC5'}
                  style={isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined}
                />
              )}
              {icon.lib === MaterialIcons && (
                <MaterialIcons
                  name={icon.name as any}
                  size={ICON_SIZE}
                  color={isActive ? '#42A5F5' : '#88BEC5'}
                  style={isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined}
                />
              )}
              {icon.lib === FontAwesome && (
                <FontAwesome
                  name={icon.name as any}
                  size={ICON_SIZE}
                  color={isActive ? '#42A5F5' : '#88BEC5'}
                  style={isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined}
                />
              )}
              {/* Badge for notification */}
              {icon.route === 'Notification' && count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0D47A1', // Nền bottom bar
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    marginBottom: 0,
    transform: [{ scale: 1 }, { translateY: 0 }],
  },
  iconActive: {
    // backgroundColor: '#FFFFFF', // Đã set inline ở trên
  },
  shadowIOS: {
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  shadowAndroid: {
    elevation: 10,
    shadowColor: 'rgba(0,0,0,0.25)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
});

export default CustomBottomTab; 