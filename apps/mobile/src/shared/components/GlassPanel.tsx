import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export default function GlassPanel({ children, style, borderRadius = 16 }: GlassPanelProps) {
  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 5,
    padding: 16,
  },
});
