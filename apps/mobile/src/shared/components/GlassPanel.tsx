import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
}

export default function GlassPanel({ children, style, intensity = 20, borderRadius = 16 }: GlassPanelProps) {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.container, { borderRadius }, style]}>
      <View style={[styles.overlay, { borderRadius }]} />
      <View style={[styles.content, { borderRadius }]}>
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  content: {
    padding: 16,
  },
});
