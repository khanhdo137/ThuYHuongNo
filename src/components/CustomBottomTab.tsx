import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useNotificationCount } from '../context/NotificationCountContext';

const TAB_HEIGHT = 60;
const ICON_SIZE = 22;
const ACTIVE_SCALE = 1.32;
const ICONS = [
  { name: 'home', lib: Ionicons, route: 'Home' },
  { name: 'phone', lib: Feather, route: 'Contact' },
  { name: 'event-available', lib: MaterialIcons, route: 'Booking' },
  { name: 'notifications', lib: Ionicons, route: 'Notification' },
  { name: 'user', lib: FontAwesome, route: 'Profile' },
];

// SVG Background Component với 3 lớp và 2 đường cong sóng
const TabBackground = ({ width, height }: { width: number; height: number }) => (
  <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
    <Defs>
      {/* Gradient cho lớp giữa (nhạt hơn) */}
      <LinearGradient id="lightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFB3D1" stopOpacity="0.8" />
        <Stop offset="30%" stopColor="#E8B4CB" stopOpacity="0.8" />
        <Stop offset="60%" stopColor="#C7B3E8" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#B3D9FF" stopOpacity="0.8" />
      </LinearGradient>
      
      {/* Gradient cho lớp dưới (đậm hơn) */}
      <LinearGradient id="darkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.9" />
        <Stop offset="30%" stopColor="#D473A3" stopOpacity="0.9" />
        <Stop offset="60%" stopColor="#A373D4" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#6B9DFF" stopOpacity="0.9" />
      </LinearGradient>
    </Defs>
    
    {/* Lớp dưới cùng - gradient đậm */}
    <Path
      d={`M0,${height} L${width},${height} L${width},${height * 0.6} Q${width * 0.8},${height * 0.45} ${width * 0.6},${height * 0.5} Q${width * 0.4},${height * 0.55} ${width * 0.2},${height * 0.48} Q${width * 0.1},${height * 0.42} 0,${height * 0.5} Z`}
      fill="url(#darkGradient)"
    />
    
    {/* Lớp giữa - gradient nhạt */}
    <Path
      d={`M0,${height * 0.5} Q${width * 0.1},${height * 0.42} ${width * 0.2},${height * 0.48} Q${width * 0.4},${height * 0.55} ${width * 0.6},${height * 0.5} Q${width * 0.8},${height * 0.45} ${width},${height * 0.6} L${width},${height * 0.3} Q${width * 0.8},${height * 0.2} ${width * 0.6},${height * 0.25} Q${width * 0.4},${height * 0.3} ${width * 0.2},${height * 0.23} Q${width * 0.1},${height * 0.18} 0,${height * 0.25} Z`}
      fill="url(#lightGradient)"
    />
    
    {/* Lớp trên cùng - màu trắng */}
    <Path
      d={`M0,${height * 0.25} Q${width * 0.1},${height * 0.18} ${width * 0.2},${height * 0.23} Q${width * 0.4},${height * 0.3} ${width * 0.6},${height * 0.25} Q${width * 0.8},${height * 0.2} ${width},${height * 0.3} L${width},0 L0,0 Z`}
      fill="#FFFFFF"
      fillOpacity="0.95"
    />
  </Svg>
);

const CustomBottomTab = ({ state, navigation }: { state: any; navigation: any }) => {
  const { count } = useNotificationCount();

  // Log để debug
  useEffect(() => {
    console.log(`🔔 CustomBottomTab - Notification count: ${count}`);
  }, [count]);

  return (
    <View style={styles.container}>
      {/* SVG Background */}
      <TabBackground width={400} height={TAB_HEIGHT} />
      
      {/* Tab Icons */}
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
                   backgroundColor: 'rgba(255, 255, 255, 0.2)', // Nền icon nổi bật với độ trong suốt
                   transform: [{ scale: ACTIVE_SCALE }],
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
                  color={isActive ? '#FFFFFF' : '#FFFFFF'}
                  style={[
                    isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined,
                    { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }
                  ]}
                />
              )}
              {icon.lib === Feather && (
                <Feather
                  name={icon.name as any}
                  size={ICON_SIZE}
                  color={isActive ? '#FFFFFF' : '#FFFFFF'}
                  style={[
                    isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined,
                    { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }
                  ]}
                />
              )}
              {icon.lib === MaterialIcons && (
                <MaterialIcons
                  name={icon.name as any}
                  size={ICON_SIZE}
                  color={isActive ? '#FFFFFF' : '#FFFFFF'}
                  style={[
                    isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined,
                    { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }
                  ]}
                />
              )}
              {icon.lib === FontAwesome && (
                <FontAwesome
                  name={icon.name as any}
                  size={ICON_SIZE}
                  color={isActive ? '#FFFFFF' : '#FFFFFF'}
                  style={[
                    isActive ? { transform: [{ scale: ACTIVE_SCALE }] } : undefined,
                    { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }
                  ]}
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
    backgroundColor: 'transparent', // Transparent để hiển thị SVG background
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
    overflow: 'hidden', // Đảm bảo SVG không bị tràn ra ngoài
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Nền nhẹ cho icon không active
    marginBottom: 0,
    transform: [{ scale: 1 }],
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