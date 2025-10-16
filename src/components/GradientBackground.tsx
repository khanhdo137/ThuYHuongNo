import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
}

/**
 * Gradient Background Component
 * Tạo background gradient từ trắng sang indigo (tương tự radial-gradient web)
 */
const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Gradient Background - từ trắng sang indigo */}
      <LinearGradient
        colors={['#FFFFFF', '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1']}
        locations={[0, 0.3, 0.5, 0.7, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default GradientBackground;

