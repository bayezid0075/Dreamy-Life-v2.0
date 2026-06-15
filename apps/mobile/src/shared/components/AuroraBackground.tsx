import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function AuroraBackground() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(226,226,233,0.6)', 'rgba(226,226,233,0)']}
        style={[styles.orb, styles.orb1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(179,236,243,0.4)', 'rgba(179,236,243,0)']}
        style={[styles.orb, styles.orb2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(255,217,226,0.5)', 'rgba(255,217,226,0)']}
        style={[styles.orb, styles.orb3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: 'hidden',
    backgroundColor: '#f8f8ff',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.15,
    left: -width * 0.3,
  },
  orb2: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.1,
    right: -width * 0.15,
  },
  orb3: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.35,
    left: width * 0.25,
  },
});
